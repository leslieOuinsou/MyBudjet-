import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

export const getDashboard = async (req, res) => {
  const { startDate, endDate, category, wallet } = req.query;
  const uid = userId(req.user);
  const where = { userId: uid };
  if (category) where.categoryId = category;
  if (wallet) where.walletId = wallet;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  // Solde global
  const wallets = await prisma.wallet.findMany({ where: { userId: uid } });
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  // Dépenses et revenus du mois
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [spentAgg, incomeAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: uid, type: 'expense', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: uid, type: 'income', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
  ]);
  const spentThisMonth = spentAgg._sum.amount || 0;
  const incomeThisMonth = incomeAgg._sum.amount || 0;

  // Totaux par catégorie
  const txs = await prisma.transaction.findMany({
    where,
    include: { category: true },
  });
  const byCategory = {};
  txs.forEach((t) => {
    if (!t.category) return;
    const key = t.category.name;
    byCategory[key] = (byCategory[key] || 0) + t.amount;
  });

  // Classement des plus grosses dépenses
  const topExpenses = serialize(
    txs
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  );

  // Statistiques mensuelles (12 derniers mois)
  const stats = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const [incomeMonth, expenseMonth] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: uid, type: 'income', date: { gte: d, lte: dEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: uid, type: 'expense', date: { gte: d, lte: dEnd } },
        _sum: { amount: true },
      }),
    ]);
    stats.unshift({
      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      income: incomeMonth._sum.amount || 0,
      expense: expenseMonth._sum.amount || 0,
    });
  }

  const quickSummary = `Tu as dépensé ${spentThisMonth} € ce mois-ci.`;
  res.json({
    totalBalance,
    spentThisMonth,
    incomeThisMonth,
    byCategory,
    topExpenses,
    stats,
    quickSummary,
  });
};
