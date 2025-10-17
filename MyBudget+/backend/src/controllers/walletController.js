import Wallet from '../models/wallet.js';

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
  const { name, balance } = req.body;
  const wallet = new Wallet({ name, balance, user: req.user?._id });
  await wallet.save();
  res.status(201).json(wallet);
};

export const updateWallet = async (req, res) => {
  const { name, balance } = req.body;
  const wallet = await Wallet.findByIdAndUpdate(req.params.id, { name, balance }, { new: true });
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
