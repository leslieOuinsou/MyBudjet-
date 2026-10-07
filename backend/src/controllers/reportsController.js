import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';
import { Parser } from 'json2csv';
import { createReport, COLORS, makeMoney, fmtDate, getUserCurrency, getUserName } from '../utils/pdfStyle.js';

function getPeriodRange(period) {
  const now = new Date();
  let startDate;
  const endDate = now;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: endDate, now };
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

async function sumByType(uid, type, startDate, endDate) {
  const result = await prisma.transaction.aggregate({
    where: {
      userId: uid,
      type,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: true,
  });
  return {
    total: result._sum.amount || 0,
    count: result._count || 0,
  };
}

async function categoryGroups(uid, type, startDate, endDate, withAvg = false) {
  const groups = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: uid,
      type,
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: true,
    ...(withAvg ? { _avg: { amount: true } } : {}),
    orderBy: { _sum: { amount: 'desc' } },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: groups.map((g) => g.categoryId).filter(Boolean) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return groups.map((g) => ({
    categoryId: g.categoryId,
    categoryName: catMap[g.categoryId]?.name || 'Non catégorisé',
    categoryColor: catMap[g.categoryId]?.color || '#CBD5E1',
    total: g._sum.amount || 0,
    count: g._count,
    ...(withAvg
      ? { avgAmount: Math.round((g._avg?.amount || 0) * 100) / 100 }
      : {}),
  }));
}

// Obtenir les statistiques financières générales
export const getFinancialStats = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getPeriodRange(period);

    const [incomeStats, expenseStats] = await Promise.all([
      sumByType(uid, 'income', startDate, endDate),
      sumByType(uid, 'expense', startDate, endDate),
    ]);

    const totalIncome = incomeStats.total;
    const totalExpense = expenseStats.total;
    const savings = totalIncome - totalExpense;

    const previousStart = new Date(startDate);
    const previousEnd = new Date(startDate);

    switch (period) {
      case 'week':
        previousStart.setDate(previousStart.getDate() - 7);
        break;
      case 'month':
        previousStart.setMonth(previousStart.getMonth() - 1);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;
      case 'year':
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;
    }

    const [previousIncomeStats, previousExpenseStats] = await Promise.all([
      sumByType(uid, 'income', previousStart, previousEnd),
      sumByType(uid, 'expense', previousStart, previousEnd),
    ]);

    const previousIncome = previousIncomeStats.total;
    const previousExpense = previousExpenseStats.total;
    const previousSavings = previousIncome - previousExpense;

    const incomeVariation = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseVariation = previousExpense > 0 ? ((totalExpense - previousExpense) / previousExpense) * 100 : 0;
    const savingsVariation = previousSavings !== 0 ? ((savings - previousSavings) / Math.abs(previousSavings)) * 100 : 0;

    res.json({
      totalIncome,
      totalExpense,
      savings,
      incomeVariation: Math.round(incomeVariation * 100) / 100,
      expenseVariation: Math.round(expenseVariation * 100) / 100,
      savingsVariation: Math.round(savingsVariation * 100) / 100,
      period,
      startDate,
      endDate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

// Obtenir l'analyse par catégorie
export const getCategoryAnalytics = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { startDate, endDate, type = 'expense' } = req.query;

    let rangeStart;
    let rangeEnd;

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      const now = new Date();
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      rangeEnd = now;
    }

    const categoryStats = await categoryGroups(uid, type, rangeStart, rangeEnd, true);
    const totalAmount = categoryStats.reduce((sum, cat) => sum + cat.total, 0);

    const analyticsWithPercentage = categoryStats.map((cat) => ({
      ...cat,
      percentage: totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100 * 100) / 100 : 0,
    }));

    res.json({
      categories: analyticsWithPercentage,
      totalAmount,
      type,
      period: { startDate, endDate },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des analyses par catégorie', error: error.message });
  }
};

// Obtenir la comparaison budget vs réalisé
export const getBudgetComparison = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { period = 'month' } = req.query;

    const budgets = await prisma.budget.findMany({
      where: { userId: uid },
      include: { category: true },
    });

    const { startDate, now } = getPeriodRange(period);

    const actualSpending = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId: uid,
        type: 'expense',
        date: { gte: startDate, lte: now },
      },
      _sum: { amount: true },
    });

    const spentMap = new Map();
    actualSpending.forEach((item) => {
      if (item.categoryId) {
        spentMap.set(item.categoryId, item._sum.amount || 0);
      }
    });

    const comparison = budgets.map((budget) => {
      const categoryId = budget.category?.id || budget.categoryId;
      const spent = spentMap.get(categoryId) || 0;
      const budgetAmount = budget.amount || 0;
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        categoryId: budget.category?.id || budget.categoryId,
        categoryName: budget.category?.name || 'Non catégorisé',
        categoryColor: budget.category?.color || '#CBD5E1',
        budgeted: budgetAmount,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good',
      };
    });

    res.json({
      comparison,
      period,
      totalBudgeted: budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: Array.from(spentMap.values()).reduce((sum, spent) => sum + spent, 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la comparaison des budgets', error: error.message });
  }
};

// Obtenir les tendances selon la période
export const getMonthlyTrends = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate;
    const endDate = now;
    let dateFormat;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFormat = 'day';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        dateFormat = 'month';
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFormat = 'week';
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: startDate, lte: endDate },
      },
      select: { amount: true, type: true, date: true },
    });

    const organizedData = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      let key;

      switch (dateFormat) {
        case 'day':
          key = `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${year}-${String(month).padStart(2, '0')}`;
          break;
        case 'week':
        default:
          key = `${year}-${String(month).padStart(2, '0')}-${String(getISOWeek(d)).padStart(2, '0')}`;
      }

      if (!organizedData[key]) {
        organizedData[key] = { income: 0, expense: 0, period: key };
      }
      organizedData[key][t.type] += t.amount;
    });

    const trendsArray = Object.values(organizedData)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((item) => ({
        ...item,
        savings: item.income - item.expense,
        savingsRate: item.income > 0 ? ((item.income - item.expense) / item.income) * 100 : 0,
      }));

    res.json({
      trends: trendsArray,
      period,
      dateFormat,
      startDate,
      endDate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tendances', error: error.message });
  }
};

// Obtenir les top transactions
export const getTopTransactions = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { limit = 10, type = 'expense', startDate, endDate } = req.query;

    let rangeStart;
    let rangeEnd;

    if (startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeEnd = new Date(endDate);
    } else {
      const now = new Date();
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
      rangeEnd = now;
    }

    const topTransactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        type,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      include: { category: true, wallet: true },
      orderBy: { amount: 'desc' },
      take: parseInt(limit, 10),
    });

    res.json({
      transactions: serialize(topTransactions),
      type,
      limit: parseInt(limit, 10),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des top transactions', error: error.message });
  }
};

// Exporter les données de rapport
export const exportReportData = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { format = 'csv', startDate, endDate, type } = req.query;

    const where = { userId: uid };
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, wallet: true },
      orderBy: { date: 'desc' },
    });

    if (format === 'csv') {
      const fields = [
        { label: 'Date', value: 'date' },
        { label: 'Description', value: 'description' },
        { label: 'Catégorie', value: 'category.name' },
        { label: 'Portefeuille', value: 'wallet.name' },
        { label: 'Type', value: 'type' },
        { label: 'Montant', value: 'amount' },
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transactions);

      res.header('Content-Type', 'text/csv');
      res.attachment(`rapport_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const [currency, userName] = await Promise.all([getUserCurrency(uid), getUserName(uid)]);
      const money = makeMoney(currency);
      const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

      const report = createReport({
        title: 'Rapport de transactions',
        subtitle: startDate && endDate ? `Du ${fmtDate(startDate)} au ${fmtDate(endDate)}` : 'Toutes les périodes',
        userName,
      });
      report.kpis([
        { label: 'Revenus', value: money(income), color: COLORS.income },
        { label: 'Dépenses', value: money(expense), color: COLORS.expense },
        { label: 'Solde', value: money(income - expense), color: income - expense >= 0 ? COLORS.brand : COLORS.expense },
      ]);
      report.section(`Transactions (${transactions.length})`);
      if (transactions.length === 0) {
        report.paragraph('Aucune transaction sur cette période.');
      } else {
        report.table({
          head: ['Date', 'Description', 'Catégorie', 'Type', 'Montant'],
          body: transactions.map((t) => [
            fmtDate(t.date),
            (t.description || t.note || '').slice(0, 40),
            t.category?.name || 'Non catégorisé',
            t.type === 'income' ? 'Revenu' : 'Dépense',
            `${t.type === 'income' ? '+' : '-'} ${money(t.amount)}`,
          ]),
          columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
          fontSize: 8.5,
        });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=rapport_transactions_${new Date().toISOString().split('T')[0]}.pdf`);
      return res.send(report.output());
    }

    return res.status(400).json({ message: 'Format non supporté' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'export", error: error.message });
  }
};

// Obtenir toutes les données de rapport (endpoint principal)
export const getReportsData = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getPeriodRange(period);

    const [incomeStats, expenseStats] = await Promise.all([
      sumByType(uid, 'income', startDate, endDate),
      sumByType(uid, 'expense', startDate, endDate),
    ]);

    const totalIncome = incomeStats.total;
    const totalExpense = expenseStats.total;
    const savings = totalIncome - totalExpense;

    const topTransactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        type: 'expense',
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true, wallet: true },
      orderBy: { amount: 'desc' },
      take: 5,
    });

    const categoryStats = await categoryGroups(uid, 'expense', startDate, endDate, false);
    const totalCategoryAmount = categoryStats.reduce((sum, cat) => sum + cat.total, 0);
    const categoriesWithPercentage = categoryStats.map((cat) => ({
      ...cat,
      percentage: totalCategoryAmount > 0 ? Math.round((cat.total / totalCategoryAmount) * 100 * 100) / 100 : 0,
    }));

    res.json({
      stats: {
        totalIncome,
        totalExpense,
        savings,
        period,
        startDate,
        endDate,
      },
      categoryAnalytics: {
        categories: categoriesWithPercentage,
        totalAmount: totalCategoryAmount,
      },
      topTransactions: {
        transactions: serialize(topTransactions),
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rapport', error: error.message });
  }
};
