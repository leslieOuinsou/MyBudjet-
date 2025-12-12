import Wallet from '../models/wallet.js';
import Transaction from '../models/transaction.js';

export const getWallets = async (req, res) => {
  const wallets = await Wallet.find({ user: req.user?._id });
  res.json(wallets);
};

export const getWallet = async (req, res) => {
  const wallet = await Wallet.findById(req.params.id);
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  res.json(wallet);
};

export const createWallet = async (req, res) => {
  const { name, balance, overdraftLimit } = req.body;
  const wallet = new Wallet({ name, balance, overdraftLimit, user: req.user?._id });
  await wallet.save();
  res.status(201).json(wallet);
};

export const updateWallet = async (req, res) => {
  const { name, balance, overdraftLimit } = req.body;
  const wallet = await Wallet.findByIdAndUpdate(req.params.id, { name, balance, overdraftLimit }, { new: true });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  res.json(wallet);
};

export const deleteWallet = async (req, res) => {
  const wallet = await Wallet.findByIdAndDelete(req.params.id);
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  res.json({ message: 'Wallet deleted' });
};

export const getWalletsSummary = async (req, res) => {
  const wallets = await Wallet.find({ user: req.user?._id });
  const total = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  res.json({ wallets, total });
};

// Fonction pour recalculer le solde d'un portefeuille
export const recalculateBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    
    // Trouver toutes les transactions de ce portefeuille
    const transactions = await Transaction.find({ 
      wallet: req.params.id,
      user: req.user?._id 
    });
    
    // Calculer le solde basé sur les transactions (en partant du solde initial)
    let calculatedBalance = parseFloat(wallet.balance) || 0;
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        calculatedBalance += parseFloat(transaction.amount) || 0;
      } else if (transaction.type === 'expense') {
        calculatedBalance -= parseFloat(transaction.amount) || 0;
      }
    });
    
    // Mettre à jour le solde du portefeuille
    const oldBalance = wallet.balance;
    wallet.balance = calculatedBalance;
    await wallet.save();
    
    console.log(`💰 Recalcul du solde pour le portefeuille ${wallet.name}:`);
    console.log(`   Ancien solde: ${oldBalance.toFixed(2)}€`);
    console.log(`   Nouveau solde: ${calculatedBalance.toFixed(2)}€`);
    console.log(`   Différence: ${(calculatedBalance - oldBalance).toFixed(2)}€`);
    
    res.json({ 
      message: 'Solde recalculé avec succès',
      oldBalance,
      newBalance: calculatedBalance,
      difference: calculatedBalance - oldBalance
    });
  } catch (error) {
    console.error('Erreur lors du recalcul:', error);
    res.status(500).json({ message: 'Erreur lors du recalcul du solde' });
  }
};
