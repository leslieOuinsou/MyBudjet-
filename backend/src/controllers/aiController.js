import prisma from '../lib/prisma.js';
import { userId as getUserId } from '../lib/serialize.js';

// Prévisions financières simples (moyenne des 3 derniers mois)
export const getForecast = async (req, res) => {
  const uid = getUserId(req.user);
  const now = new Date();
  const forecasts = {};

  for (let i = 1; i <= 3; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const txs = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: start, lte: end },
      },
      select: { categoryId: true, amount: true, type: true },
    });
    txs.forEach((t) => {
      const key = t.categoryId || 'uncategorized';
      if (!forecasts[key]) forecasts[key] = [];
      forecasts[key].push(t.amount * (t.type === 'expense' ? -1 : 1));
    });
  }

  const prediction = {};
  for (const cat in forecasts) {
    const arr = forecasts[cat];
    prediction[cat] = arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  res.json({ prediction });
};

// Conseils personnalisés simples
export const getAdvice = async (req, res) => {
  const uid = getUserId(req.user);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const txs = await prisma.transaction.findMany({
    where: {
      userId: uid,
      date: { gte: lastMonth },
    },
    include: { category: true },
  });

  const byCategory = {};
  txs.forEach((t) => {
    if (!t.category) return;
    const key = t.category.name;
    byCategory[key] = (byCategory[key] || 0) + (t.type === 'expense' ? t.amount : 0);
  });

  let maxCat = null;
  let maxVal = 0;
  for (const cat in byCategory) {
    if (byCategory[cat] > maxVal) {
      maxVal = byCategory[cat];
      maxCat = cat;
    }
  }

  const advice = maxCat
    ? `Réduis tes dépenses ${maxCat} de 10 % le mois prochain pour économiser ${Math.round(maxVal * 0.1)} €.`
    : 'Continue à bien gérer tes finances !';
  res.json({ advice });
};

// Suggestions d’épargne ou d’équilibrage
export const getSavingSuggestion = async (req, res) => {
  const uid = getUserId(req.user);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const txs = await prisma.transaction.findMany({
    where: {
      userId: uid,
      date: { gte: monthStart },
    },
    select: { type: true, amount: true },
  });

  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const toSave = Math.max(0, Math.round((income - expense) * 0.2));
  const suggestion = toSave > 0
    ? `Tu pourrais épargner ${toSave} € ce mois-ci.`
    : 'Essaie de réduire tes dépenses pour pouvoir épargner.';
  res.json({ suggestion });
};

const MONTHLY_FACTOR = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };

const normalize = (text) =>
  (text || '').toLowerCase().replace(/[0-9]+/g, '').replace(/[^a-zà-ÿ ]/g, ' ').replace(/\s+/g, ' ').trim();

const detectFrequency = (gaps) => {
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg >= 6 && avg <= 8) return 'weekly';
  if (avg >= 27 && avg <= 34) return 'monthly';
  if (avg >= 350 && avg <= 380) return 'yearly';
  return null;
};

// Détecte les dépenses récurrentes (même libellé, montant stable, intervalle régulier)
export const getSubscriptions = async (req, res) => {
  const uid = getUserId(req.user);
  const since = new Date();
  since.setMonth(since.getMonth() - 13);

  const txs = await prisma.transaction.findMany({
    where: { userId: uid, type: 'expense', date: { gte: since } },
    include: { category: { select: { name: true } } },
    orderBy: { date: 'asc' },
  });

  const groups = {};
  for (const t of txs) {
    const key = normalize(t.description);
    if (!key) continue;
    (groups[key] = groups[key] || []).push(t);
  }

  const subscriptions = [];
  for (const [key, list] of Object.entries(groups)) {
    if (list.length < 3) continue;
    const amounts = list.map((t) => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    if (amounts.some((a) => Math.abs(a - mean) > mean * 0.15)) continue;

    const gaps = list.slice(1).map((t, i) => (t.date - list[i].date) / 86400000);
    const frequency = detectFrequency(gaps);
    if (!frequency) continue;

    const last = list[list.length - 1];
    const monthlyCost = mean * MONTHLY_FACTOR[frequency];
    subscriptions.push({
      name: last.description,
      key,
      category: last.category?.name || null,
      amount: Math.round(mean * 100) / 100,
      frequency,
      occurrences: list.length,
      lastDate: last.date,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      yearlyCost: Math.round(monthlyCost * 12 * 100) / 100,
    });
  }

  subscriptions.sort((a, b) => b.yearlyCost - a.yearlyCost);
  res.json({
    subscriptions,
    totalMonthly: Math.round(subscriptions.reduce((s, x) => s + x.monthlyCost, 0) * 100) / 100,
    totalYearly: Math.round(subscriptions.reduce((s, x) => s + x.yearlyCost, 0) * 100) / 100,
  });
};

// Score de santé financière sur 100 : épargne, budgets respectés, régularité, objectifs
export const getHealthScore = async (req, res) => {
  const uid = getUserId(req.user);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [income, expense, budgets, goals, recentTxs] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId: uid, type: 'income', date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId: uid, type: 'expense', date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.budget.findMany({ where: { userId: uid } }),
    prisma.financialGoal.findMany({ where: { userId: uid } }),
    prisma.transaction.count({ where: { userId: uid, date: { gte: new Date(now.getTime() - 30 * 86400000) } } }),
  ]);

  const totalIncome = income._sum.amount || 0;
  const totalExpense = expense._sum.amount || 0;
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
  const savingsPoints = Math.max(0, Math.min(40, Math.round((savingsRate / 0.2) * 40)));

  let budgetPoints = 25;
  let budgetsOver = 0;
  if (budgets.length > 0) {
    const spentList = await Promise.all(
      budgets.map((b) =>
        prisma.transaction.aggregate({
          where: {
            userId: uid,
            type: 'expense',
            date: { gte: monthStart },
            ...(b.categoryId ? { categoryId: b.categoryId } : {}),
            ...(b.walletId ? { walletId: b.walletId } : {}),
          },
          _sum: { amount: true },
        })
      )
    );
    budgetsOver = budgets.filter((b, i) => (spentList[i]._sum.amount || 0) > b.amount).length;
    budgetPoints = Math.round(((budgets.length - budgetsOver) / budgets.length) * 30);
  }

  const goalPoints = goals.length
    ? Math.round((goals.reduce((s, g) => s + Math.min(1, g.currentAmount / (g.targetAmount || 1)), 0) / goals.length) * 15)
    : 8;
  const trackingPoints = Math.min(15, Math.round((recentTxs / 10) * 15));

  const score = Math.min(100, savingsPoints + budgetPoints + goalPoints + trackingPoints);
  const level = score >= 80 ? 'excellent' : score >= 60 ? 'bon' : score >= 40 ? 'moyen' : 'fragile';

  const tips = [];
  if (savingsRate < 0.1) tips.push('Essaie de mettre de côté au moins 10 % de tes revenus.');
  if (budgetsOver > 0) tips.push(`${budgetsOver} budget(s) dépassé(s) ce mois-ci : vérifie tes dépenses.`);
  if (budgets.length === 0) tips.push('Crée des budgets par catégorie pour mieux suivre tes dépenses.');
  if (goals.length === 0) tips.push('Fixe-toi un objectif d’épargne pour rester motivé.');
  if (recentTxs < 5) tips.push('Enregistre tes dépenses plus régulièrement pour des analyses fiables.');

  res.json({
    score,
    level,
    savingsRate: Math.round(savingsRate * 100),
    breakdown: {
      savings: { points: savingsPoints, max: 40 },
      budgets: { points: budgetPoints, max: 30 },
      goals: { points: goalPoints, max: 15 },
      tracking: { points: trackingPoints, max: 15 },
    },
    tips,
  });
};

const STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'en', 'au', 'aux', 'pour', 'par', 'sur', 'carte', 'paiement', 'cb', 'achat']);

const tokenize = (text) =>
  normalize(text)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

// Suggère une catégorie d'après les libellés déjà classés par l'utilisateur
export const suggestCategory = async (req, res) => {
  const uid = getUserId(req.user);
  const description = String(req.query.description || '');
  const type = req.query.type === 'income' ? 'income' : 'expense';
  const tokens = tokenize(description);
  if (tokens.length === 0) return res.json({ suggestion: null });

  const history = await prisma.transaction.findMany({
    where: { userId: uid, type, categoryId: { not: null } },
    select: { description: true, categoryId: true, category: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 1000,
  });

  const exact = normalize(description);
  const scores = {};
  for (const t of history) {
    const histTokens = new Set(tokenize(t.description));
    const shared = tokens.filter((w) => histTokens.has(w)).length;
    if (shared === 0) continue;
    const weight = normalize(t.description) === exact ? 3 : shared / tokens.length;
    const entry = (scores[t.categoryId] = scores[t.categoryId] || { name: t.category?.name, score: 0 });
    entry.score += weight;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  if (ranked.length === 0) return res.json({ suggestion: null });

  const total = ranked.reduce((s, [, v]) => s + v.score, 0);
  const [categoryId, best] = ranked[0];
  const confidence = Math.round((best.score / total) * 100);
  res.json({
    suggestion: confidence >= 50 ? { categoryId, name: best.name, confidence } : null,
  });
};
