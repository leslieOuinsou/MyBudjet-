import BankAccount from '../models/bankAccount.js';
import Transaction from '../models/transaction.js';
import Wallet from '../models/wallet.js';
import Category from '../models/category.js';

// Parser pour différents formats CSV
const parseCSV = (content) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Détecter le format (séparateur)
  const separator = lines[0].includes(';') ? ';' : ',';
  
  const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
  const transactions = [];
  
  // Parser chaque ligne
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim());
    
    if (values.length < 2) continue; // Ligne vide ou invalide
    
    const transaction = {};
    headers.forEach((header, index) => {
      transaction[header] = values[index] || '';
    });
    
    transactions.push(transaction);
  }
  
  return transactions;
};

// Normaliser une transaction (différents formats bancaires)
const normalizeTransaction = (rawTransaction) => {
  const normalized = {
    date: null,
    description: '',
    amount: 0,
    type: 'expense',
    category: null,
    reference: '',
  };
  
  // Trouver la date (différents noms de colonnes)
  const dateFields = ['date', 'date opération', 'date operation', 'transaction date', 'posted date'];
  for (const field of dateFields) {
    if (rawTransaction[field]) {
      // Parser la date (formats: DD/MM/YYYY, YYYY-MM-DD, etc.)
      const dateStr = rawTransaction[field];
      let parsedDate;
      
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        parsedDate = new Date(`${year}-${month}-${day}`);
      } else if (dateStr.includes('-')) {
        parsedDate = new Date(dateStr);
      }
      
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        normalized.date = parsedDate;
        break;
      }
    }
  }
  
  // Trouver la description
  const descFields = ['libellé', 'libelle', 'description', 'label', 'memo', 'details'];
  for (const field of descFields) {
    if (rawTransaction[field]) {
      normalized.description = rawTransaction[field];
      break;
    }
  }
  
  // Trouver le montant
  const amountFields = ['montant', 'amount', 'débit', 'debit', 'crédit', 'credit'];
  for (const field of amountFields) {
    if (rawTransaction[field]) {
      let amountStr = rawTransaction[field].replace(',', '.').replace(/[^\d.-]/g, '');
      const amount = parseFloat(amountStr);
      
      if (!isNaN(amount)) {
        normalized.amount = Math.abs(amount);
        
        // Déterminer le type (débit/crédit)
        if (field.includes('crédit') || field.includes('credit') || amount > 0) {
          normalized.type = 'income';
        } else {
          normalized.type = 'expense';
        }
        break;
      }
    }
  }
  
  // Référence/numéro de transaction
  const refFields = ['référence', 'reference', 'transaction id', 'id'];
  for (const field of refFields) {
    if (rawTransaction[field]) {
      normalized.reference = rawTransaction[field];
      break;
    }
  }
  
  return normalized;
};

// Endpoint pour upload et prévisualisation
export const uploadBankCSV = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bankAccountId, csvContent } = req.body;
    
    if (!csvContent) {
      return res.status(400).json({ message: 'Fichier CSV manquant' });
    }
    
    // Vérifier que le compte bancaire existe et appartient à l'utilisateur
    if (bankAccountId) {
      const bankAccount = await BankAccount.findOne({ _id: bankAccountId, user: userId });
      if (!bankAccount) {
        return res.status(404).json({ message: 'Compte bancaire introuvable' });
      }
    }
    
    // Parser le CSV
    const rawTransactions = parseCSV(csvContent);
    
    // Normaliser les transactions
    const normalizedTransactions = rawTransactions
      .map(normalizeTransaction)
      .filter(t => t.date && t.amount > 0); // Filtrer les transactions invalides
    
    console.log(`✅ ${normalizedTransactions.length} transactions parsées depuis le CSV`);
    
    res.json({
      message: 'CSV parsé avec succès',
      preview: normalizedTransactions.slice(0, 10), // Prévisualisation des 10 premières
      total: normalizedTransactions.length,
      transactions: normalizedTransactions,
    });
  } catch (error) {
    console.error('❌ Erreur lors du parsing CSV:', error);
    res.status(500).json({ message: 'Erreur lors du parsing du fichier CSV' });
  }
};

// Endpoint pour importer les transactions en base
export const importBankTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bankAccountId, transactions } = req.body;
    
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ message: 'Aucune transaction à importer' });
    }
    
    // Récupérer le compte bancaire
    let bankAccount = null;
    if (bankAccountId) {
      bankAccount = await BankAccount.findOne({ _id: bankAccountId, user: userId });
    }
    
    // Récupérer ou créer un wallet par défaut
    let wallet = await Wallet.findOne({ user: userId, isDefault: true });
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        name: 'Portefeuille principal',
        balance: 0,
        currency: 'EUR',
        isDefault: true,
      });
    }
    
    // Récupérer ou créer une catégorie par défaut
    let defaultCategory = await Category.findOne({ user: userId, name: 'Import bancaire' });
    if (!defaultCategory) {
      defaultCategory = await Category.create({
        user: userId,
        name: 'Import bancaire',
        type: 'expense',
        color: '#6C757D',
        icon: '📥',
      });
    }
    
    const importedTransactions = [];
    let totalImported = 0;
    let totalSkipped = 0;
    
    // Importer chaque transaction
    for (const t of transactions) {
      try {
        // Vérifier si la transaction existe déjà (éviter les doublons)
        const exists = await Transaction.findOne({
          user: userId,
          date: t.date,
          amount: t.amount,
          description: t.description,
        });
        
        if (exists) {
          totalSkipped++;
          continue;
        }
        
        // Créer la transaction
        const newTransaction = await Transaction.create({
          user: userId,
          wallet: wallet._id,
          bankAccount: bankAccount?._id || null,
          category: defaultCategory._id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date,
          notes: `Importé depuis CSV${t.reference ? ` - Ref: ${t.reference}` : ''}`,
          tags: ['import', 'csv'],
        });
        
        // Mettre à jour le solde du wallet
        if (t.type === 'income') {
          wallet.balance += t.amount;
        } else {
          wallet.balance -= t.amount;
        }
        
        // Mettre à jour le solde du compte bancaire
        if (bankAccount) {
          if (t.type === 'income') {
            bankAccount.balance += t.amount;
          } else {
            bankAccount.balance -= t.amount;
          }
        }
        
        importedTransactions.push(newTransaction);
        totalImported++;
      } catch (error) {
        console.error('Erreur import transaction:', error);
        totalSkipped++;
      }
    }
    
    // Sauvegarder les soldes mis à jour
    await wallet.save();
    if (bankAccount) {
      await bankAccount.save();
    }
    
    console.log(`✅ Import terminé: ${totalImported} importées, ${totalSkipped} ignorées`);
    
    res.json({
      message: `${totalImported} transaction(s) importée(s) avec succès`,
      imported: totalImported,
      skipped: totalSkipped,
      transactions: importedTransactions,
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import des transactions' });
  }
};

export default {
  uploadBankCSV,
  importBankTransactions,
};

