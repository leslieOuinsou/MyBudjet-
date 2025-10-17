import Transaction from '../models/transaction.js';
import Wallet from '../models/wallet.js';

export const getDashboard = async (req, res) => {
  const { startDate, endDate, category, wallet } = req.query;
  const user = req.user._id;
  let filter = { user };
  if (category) filter.category = category;
  if (wallet) filter.wallet = wallet;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  // Solde global
  const wallets = await Wallet.find({ user });
  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  // Dépenses et revenus du mois
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthFilter = { user, date: { $gte: monthStart, $lte: monthEnd } };
  const monthTxs = await Transaction.find(monthFilter);
  const spentThisMonth = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const incomeThisMonth = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  // Totaux par catégorie
  const txs = await Transaction.find(filter).populate('category');
  const byCategory = {};
  txs.forEach(t => {
    if (!t.category) return;
    const key = t.category.name;
    byCategory[key] = (byCategory[key] || 0) + t.amount;
  });
  // Classement des plus grosses dépenses
  const topExpenses = txs.filter(t => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  // Statistiques mensuelles (12 derniers mois)
  const stats = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const txsMonth = await Transaction.find({ user, date: { $gte: d, $lte: dEnd } });
    stats.unshift({
      month: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      income: txsMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txsMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    });
  }
  // Widget résumé rapide
  const quickSummary = `Tu as dépensé ${spentThisMonth} € ce mois-ci.`;
  res.json({
    totalBalance,
    spentThisMonth,
    incomeThisMonth,
    byCategory,
    topExpenses,
    stats,
    quickSummary
  });
};
