import Transaction from '../models/transaction.js';
import Budget from '../models/budget.js';
import Wallet from '../models/wallet.js';
import nodemailer from 'nodemailer';
import {
  createBudgetAlertNotification,
  createBudgetExceededNotification,
  createTransactionNotification
} from '../utils/notificationGenerator.js';

async function checkBudgetAndNotify(transaction) {
  // Vérifie le budget par catégorie
  if (transaction.type === 'expense' && transaction.category) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const spent = await Transaction.aggregate([
      { $match: { user: transaction.user, category: transaction.category, type: 'expense', date: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSpent = spent[0]?.total || 0;
    const budget = await Budget.findOne({ user: transaction.user, category: transaction.category, period: 'month' });
    
    if (budget) {
      const percentage = Math.round((totalSpent / budget.amount) * 100);
      const remaining = budget.amount - totalSpent;
      
      // Notification si 80% atteint
      if (percentage >= 80 && percentage < 100 && remaining > 0) {
        await createBudgetAlertNotification(
          transaction.user,
          transaction.category,
          percentage,
          Math.abs(remaining)
        );
      }
      
      // Notification si budget dépassé
      if (totalSpent > budget.amount) {
        const exceeded = totalSpent - budget.amount;
        await createBudgetExceededNotification(
          transaction.user,
          transaction.category,
          Math.abs(exceeded)
        );
        
        // Envoi d'alerte email (optionnel)
        const user = await import('../models/user.js').then(m => m.default.findById(transaction.user));
        if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
              to: user.email,
              subject: 'Alerte budget dépassé',
              text: `Vous avez dépassé votre budget pour la catégorie ${transaction.category} de ${exceeded.toFixed(2)}€`
            });
            console.log('✅ Email d\'alerte envoyé à', user.email);
          } catch (err) {
            console.error('⚠️ Erreur envoi email (ignorée):', err.message);
          }
        }
      }
    }
  }
  // Notification si le solde devient négatif (sans crédit automatique)
  if (transaction.wallet && transaction.type === 'expense') {
    const wallet = await Wallet.findById(transaction.wallet);
    if (wallet && wallet.balance < 0) {
      console.log(`⚠️ Solde négatif détecté (${wallet.balance} €) pour le portefeuille ${wallet.name}`);
      
      // Envoyer une alerte par email si le solde est négatif
      const user = await import('../models/user.js').then(m => m.default.findById(transaction.user));
      
      if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          });
          
          await transporter.sendMail({
            to: user.email,
            subject: '⚠️ Alerte: Solde négatif',
            html: `
              <h2 style="color: #dc2626;">Alerte de Solde Négatif</h2>
              <p>Cher/Chère ${user.name},</p>
              <p>Le solde de votre portefeuille <strong>${wallet.name}</strong> est maintenant négatif.</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Solde actuel:</strong> ${wallet.balance.toFixed(2)} €</p>
                <p><strong>Découvert autorisé:</strong> -${(wallet.overdraftLimit || 0).toFixed(2)} €</p>
              </div>
              <p style="color: #dc2626; font-weight: bold;">Veuillez approvisionner votre compte.</p>
            `
          });
          console.log('✅ Email d\'alerte solde négatif envoyé à', user.email);
        } catch (err) {
          console.error('⚠️ Erreur envoi email:', err.message);
        }
      }
    }
  }
}

export const getTransactions = async (req, res) => {
  const { category, wallet, startDate, endDate, search } = req.query;
  let filter = { user: req.user?._id };
  if (category) filter.category = category;
  if (wallet) filter.wallet = wallet;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: 'i' } },
      { amount: isNaN(Number(search)) ? undefined : Number(search) }
    ].filter(Boolean);
  }
  const transactions = await Transaction.find(filter)
    .populate('category')
    .populate('wallet');
  res.json(transactions);
};

export const getTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('category')
    .populate('wallet');
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  res.json(transaction);
};

export const createTransaction = async (req, res) => {
  const { amount, type, category, wallet, date, description, note } = req.body;
  let attachment = req.file ? `/uploads/${req.file.filename}` : undefined;
  
  console.log('🔄 Création de transaction:', { amount, type, category, wallet });
  
  // Vérifier le découvert autorisé AVANT de créer la transaction
  if (type === 'expense' && wallet) {
    console.log('💰 Vérification du portefeuille pour dépense...');
    const walletDoc = await Wallet.findById(wallet);
    console.log('💳 Portefeuille trouvé:', walletDoc ? `${walletDoc.name} (${walletDoc.balance} €)` : 'Non trouvé');
    
    if (walletDoc) {
      const expenseAmount = parseFloat(amount);
      const newBalance = walletDoc.balance - expenseAmount;
      const overdraftLimit = walletDoc.overdraftLimit || 0;
      
      // Vérifier si le découvert autorisé serait dépassé
      if (newBalance < -overdraftLimit) {
        const deficit = Math.abs(newBalance + overdraftLimit);
        console.log(`❌ Découvert autorisé dépassé ! Déficit: ${deficit}€`);
        
        const user = await import('../models/user.js').then(m => m.default.findById(req.user._id));
        
        // Envoyer un email d'alerte
        if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            
            await transporter.sendMail({
              to: user.email,
              subject: '🚨 Alerte: Découvert autorisé dépassé',
              html: `
                <h2 style="color: #dc2626;">Alerte de Découvert</h2>
                <p>Cher/Chère ${user.name},</p>
                <p>Une tentative de dépense a été refusée car elle dépasserait votre découvert autorisé.</p>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Portefeuille:</strong> ${walletDoc.name}</p>
                  <p><strong>Solde actuel:</strong> ${walletDoc.balance.toFixed(2)} €</p>
                  <p><strong>Découvert autorisé:</strong> -${overdraftLimit.toFixed(2)} €</p>
                  <p><strong>Montant de la dépense refusée:</strong> ${expenseAmount.toFixed(2)} €</p>
                  <p><strong>Dépassement:</strong> ${deficit.toFixed(2)} €</p>
                </div>
                <p style="color: #dc2626; font-weight: bold;">➡️ Cette dépense a été refusée pour protéger vos finances.</p>
                <p>Veuillez approvisionner votre compte ou réduire le montant de la dépense.</p>
              `
            });
            console.log('✅ Email d\'alerte découvert envoyé à', user.email);
          } catch (err) {
            console.error('⚠️ Erreur envoi email:', err.message);
          }
        }
        
        return res.status(400).json({ 
          message: `Dépense refusée : découvert autorisé dépassé de ${deficit.toFixed(2)}€. Solde actuel: ${walletDoc.balance.toFixed(2)}€, Découvert autorisé: -${overdraftLimit.toFixed(2)}€` 
        });
      }
      
      console.log(`✅ Découvert OK. Nouveau solde: ${newBalance.toFixed(2)}€ (limite: -${overdraftLimit}€)`);
    }
  } else {
    console.log('ℹ️ Pas de vérification de portefeuille (pas une dépense ou pas de portefeuille)');
  }
  
  const transaction = new Transaction({
    amount,
    type,
    category,
    wallet,
    user: req.user?._id,
    date,
    description: description || note,
    attachment,
  });
  await transaction.save();
  
  // Mettre à jour le solde du portefeuille après la création de la transaction
  if (wallet && type) {
    const walletToUpdate = await Wallet.findById(wallet);
    if (walletToUpdate) {
      const oldBalance = walletToUpdate.balance;
      console.log(`💳 Portefeuille: ${walletToUpdate.name}`);
      console.log(`💳 Solde AVANT transaction: ${oldBalance}€`);
      console.log(`💰 Transaction: ${type} de ${amount}€`);
      
      if (type === 'expense') {
        walletToUpdate.balance -= parseFloat(amount);
        console.log(`➖ Retrait de ${amount}€`);
      } else if (type === 'income') {
        walletToUpdate.balance += parseFloat(amount);
        console.log(`➕ Ajout de ${amount}€`);
      }
      
      await walletToUpdate.save();
      console.log(`💰 Nouveau solde: ${walletToUpdate.balance}€`);
      console.log(`📊 Calcul: ${oldBalance} ${type === 'expense' ? '-' : '+'} ${amount} = ${walletToUpdate.balance}`);
    }
  }
  
  await checkBudgetAndNotify(transaction);
  res.status(201).json(transaction);
};

export const updateTransaction = async (req, res) => {
  const { amount, type, category, wallet, date, description, note } = req.body;
  
  // Récupérer l'ancienne transaction pour restaurer le solde
  const oldTransaction = await Transaction.findById(req.params.id);
  
  let update = { amount, type, category, wallet, date, description: description || note };
  if (req.file) update.attachment = `/uploads/${req.file.filename}`;
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true }
  ).populate('category').populate('wallet');
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  
  // Mettre à jour le solde du portefeuille
  if (oldTransaction && oldTransaction.wallet) {
    const oldWallet = await Wallet.findById(oldTransaction.wallet);
    if (oldWallet) {
      // Restaurer l'ancien solde
      if (oldTransaction.type === 'expense') {
        oldWallet.balance += oldTransaction.amount;
      } else if (oldTransaction.type === 'income') {
        oldWallet.balance -= oldTransaction.amount;
      }
      await oldWallet.save();
    }
  }
  
  if (wallet && type) {
    const walletToUpdate = await Wallet.findById(wallet);
    if (walletToUpdate) {
      if (type === 'expense') {
        walletToUpdate.balance -= parseFloat(amount);
      } else if (type === 'income') {
        walletToUpdate.balance += parseFloat(amount);
      }
      await walletToUpdate.save();
      console.log(`💰 Solde du portefeuille ${walletToUpdate.name} mis à jour: ${walletToUpdate.balance}€`);
    }
  }
  
  await checkBudgetAndNotify(transaction);
  res.json(transaction);
};

export const deleteTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  
  console.log(`🗑️ Suppression de transaction: ${transaction.type} de ${transaction.amount}€`);
  
  // Restaurer le solde du portefeuille
  if (transaction.wallet && transaction.type) {
    const wallet = await Wallet.findById(transaction.wallet);
    if (wallet) {
      console.log(`💳 Solde AVANT suppression: ${wallet.balance}€`);
      if (transaction.type === 'expense') {
        wallet.balance += transaction.amount;
        console.log(`➕ Ajout de ${transaction.amount}€ (dépense restaurée)`);
      } else if (transaction.type === 'income') {
        wallet.balance -= transaction.amount;
        console.log(`➖ Retrait de ${transaction.amount}€ (revenu restauré)`);
      }
      await wallet.save();
      console.log(`💰 Solde APRÈS suppression: ${wallet.balance}€`);
      console.log(`✅ Portefeuille ${wallet.name} - Solde restauré: ${wallet.balance}€`);
    } else {
      console.log(`❌ Portefeuille ${transaction.wallet} non trouvé`);
    }
  } else {
    console.log(`ℹ️ Pas de portefeuille associé à cette transaction`);
  }
  
  await Transaction.findByIdAndDelete(req.params.id);
  res.json({ message: 'Transaction deleted' });
};
