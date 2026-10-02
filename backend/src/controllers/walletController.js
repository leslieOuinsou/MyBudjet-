import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

export const getWallets = async (req, res) => {
  const wallets = serialize(
    await prisma.wallet.findMany({
      where: { userId: userId(req.user) },
    })
  );
  res.json(wallets);
};

export const getWallet = async (req, res) => {
  const wallet = await prisma.wallet.findUnique({ where: { id: req.params.id } });
  if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
  res.json(serialize(wallet));
};

export const createWallet = async (req, res) => {
  const { name, balance, overdraftLimit } = req.body;
  const wallet = await prisma.wallet.create({
    data: {
      name,
      balance: balance ?? 0,
      overdraftLimit: overdraftLimit ?? 0,
      userId: userId(req.user),
    },
  });
  res.status(201).json(serialize(wallet));
};

export const updateWallet = async (req, res) => {
  const { name, balance, overdraftLimit } = req.body;
  try {
    const wallet = await prisma.wallet.update({
      where: { id: req.params.id },
      data: { name, balance, overdraftLimit },
    });
    res.json(serialize(wallet));
  } catch {
    return res.status(404).json({ message: 'Wallet not found' });
  }
};

export const deleteWallet = async (req, res) => {
  try {
    await prisma.wallet.delete({ where: { id: req.params.id } });
    res.json({ message: 'Wallet deleted' });
  } catch {
    return res.status(404).json({ message: 'Wallet not found' });
  }
};

export const getWalletsSummary = async (req, res) => {
  const wallets = await prisma.wallet.findMany({
    where: { userId: userId(req.user) },
  });
  const total = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  res.json({ wallets: serialize(wallets), total });
};

// Fonction pour recalculer le solde d'un portefeuille
export const recalculateBalance = async (req, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({ where: { id: req.params.id } });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: req.params.id,
        userId: userId(req.user),
      },
    });

    let calculatedBalance = 0;
    transactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        calculatedBalance += parseFloat(transaction.amount) || 0;
      } else if (transaction.type === 'expense') {
        calculatedBalance -= parseFloat(transaction.amount) || 0;
      }
    });

    const oldBalance = wallet.balance;
    await prisma.wallet.update({
      where: { id: req.params.id },
      data: { balance: calculatedBalance },
    });

    console.log(`💰 Recalcul du solde pour le portefeuille ${wallet.name}:`);
    console.log(`   Ancien solde: ${oldBalance.toFixed(2)}€`);
    console.log(`   Nouveau solde: ${calculatedBalance.toFixed(2)}€`);
    console.log(`   Différence: ${(calculatedBalance - oldBalance).toFixed(2)}€`);

    res.json({
      message: 'Solde recalculé avec succès',
      oldBalance,
      newBalance: calculatedBalance,
      difference: calculatedBalance - oldBalance,
    });
  } catch (error) {
    console.error('Erreur lors du recalcul:', error);
    res.status(500).json({ message: 'Erreur lors du recalcul du solde' });
  }
};
