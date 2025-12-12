import Wallet from '../models/wallet.js';
import Transaction from '../models/transaction.js';

export const transfer = async (req, res) => {
  const { fromWallet, toWallet, amount, note } = req.body;
  if (fromWallet === toWallet) return res.status(400).json({ message: 'Wallets must be different' });
  const from = await Wallet.findById(fromWallet);
  const to = await Wallet.findById(toWallet);
  if (!from || !to) return res.status(404).json({ message: 'Wallet not found' });
  if (from.balance < amount) return res.status(400).json({ message: 'Solde insuffisant' });
  from.balance -= amount;
  to.balance += amount;
  await from.save();
  await to.save();
  // Log as two transactions
  await Transaction.create({
    amount,
    type: 'expense',
    wallet: fromWallet,
    user: req.user._id,
    note: note || `Transfert vers ${to.name}`,
    date: new Date(),
  });
  await Transaction.create({
    amount,
    type: 'income',
    wallet: toWallet,
    user: req.user._id,
    note: note || `Transfert depuis ${from.name}`,
    date: new Date(),
  });
  res.json({ message: 'Transfert effectué' });
};
