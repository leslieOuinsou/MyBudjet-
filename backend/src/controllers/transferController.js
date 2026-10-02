import prisma from '../lib/prisma.js';
import { userId } from '../lib/serialize.js';

export const transfer = async (req, res) => {
  const { fromWallet, toWallet, amount, note } = req.body;
  if (fromWallet === toWallet) return res.status(400).json({ message: 'Wallets must be different' });

  const from = await prisma.wallet.findUnique({ where: { id: fromWallet } });
  const to = await prisma.wallet.findUnique({ where: { id: toWallet } });
  if (!from || !to) return res.status(404).json({ message: 'Wallet not found' });

  const transferAmount = parseFloat(amount);
  if (from.balance < transferAmount) return res.status(400).json({ message: 'Solde insuffisant' });

  const uid = userId(req.user);
  const now = new Date();

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: fromWallet },
      data: { balance: { decrement: transferAmount } },
    }),
    prisma.wallet.update({
      where: { id: toWallet },
      data: { balance: { increment: transferAmount } },
    }),
    prisma.transaction.create({
      data: {
        amount: transferAmount,
        type: 'expense',
        walletId: fromWallet,
        userId: uid,
        note: note || `Transfert vers ${to.name}`,
        description: note || `Transfert vers ${to.name}`,
        date: now,
      },
    }),
    prisma.transaction.create({
      data: {
        amount: transferAmount,
        type: 'income',
        walletId: toWallet,
        userId: uid,
        note: note || `Transfert depuis ${from.name}`,
        description: note || `Transfert depuis ${from.name}`,
        date: now,
      },
    }),
  ]);

  res.json({ message: 'Transfert effectué' });
};
