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
