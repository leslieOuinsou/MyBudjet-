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
  // Vérifie le solde faible
  if (transaction.wallet) {
    const wallet = await Wallet.findById(transaction.wallet);
    if (wallet && wallet.balance < 10) { // seuil à adapter
      const user = await import('../models/user.js').then(m => m.default.findById(transaction.user));
      if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
          });
          await transporter.sendMail({
            to: user.email,
            subject: 'Alerte solde faible',
            text: `Le solde de votre wallet ${wallet.name} est faible (${wallet.balance} €)`
          });
          console.log('✅ Email d\'alerte solde faible envoyé à', user.email);
        } catch (err) {
          console.error('⚠️ Erreur envoi email (ignorée):', err.message);
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
  await checkBudgetAndNotify(transaction);
  res.status(201).json(transaction);
};

export const updateTransaction = async (req, res) => {
  const { amount, type, category, wallet, date, description, note } = req.body;
  let update = { amount, type, category, wallet, date, description: description || note };
  if (req.file) update.attachment = `/uploads/${req.file.filename}`;
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true }
  ).populate('category').populate('wallet');
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  await checkBudgetAndNotify(transaction);
  res.json(transaction);
};

export const deleteTransaction = async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ message: 'Transaction deleted' });
};
