import prisma from '../lib/prisma.js';
import { userId as getUserId } from '../lib/serialize.js';

const DEMO_TAG = '__demo__';
const DEMO_WALLET = 'Compte démo';

// [libellé, montant, catégorie, type, jours en arrière]
const DEMO_TRANSACTIONS = [
  ['Salaire', 2400, 'Salaire', 'income', 28],
  ['Freelance — site web', 450, 'Freelance', 'income', 15],
  ['Loyer', 780, 'Logement', 'expense', 27],
  ['Courses supermarché', 86.4, 'Alimentation', 'expense', 24],
  ['Abonnement transport', 75, 'Transport', 'expense', 22],
  ['Restaurant', 42.5, 'Alimentation', 'expense', 19],
  ['Facture électricité', 64.9, 'Factures', 'expense', 17],
  ['Cinéma', 24, 'Divertissement', 'expense', 13],
  ['Courses supermarché', 92.1, 'Alimentation', 'expense', 10],
  ['Pharmacie', 18.3, 'Santé', 'expense', 8],
  ['Vêtements', 59.9, 'Vêtements', 'expense', 5],
  ['Carburant', 48, 'Transport', 'expense', 3],
  ['Courses supermarché', 71.2, 'Alimentation', 'expense', 1],
];

const FALLBACK_COLORS = { income: '#22C55E', expense: '#EF4444' };

async function findOrCreateCategory(uid, name, type) {
  const existing = await prisma.category.findFirst({ where: { userId: uid, name, type } });
  if (existing) return existing;
  return prisma.category.create({ data: { userId: uid, name, type, color: FALLBACK_COLORS[type] } });
}

export const demoStatus = async (req, res) => {
  const uid = getUserId(req.user);
  const count = await prisma.transaction.count({ where: { userId: uid, tags: { has: DEMO_TAG } } });
  res.json({ active: count > 0, count });
};

export const loadDemoData = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const already = await prisma.transaction.count({ where: { userId: uid, tags: { has: DEMO_TAG } } });
    if (already > 0) return res.status(409).json({ message: 'Les données de démonstration sont déjà chargées' });

    const balance = DEMO_TRANSACTIONS.reduce((sum, t) => sum + (t[3] === 'income' ? t[1] : -t[1]), 0);
    let wallet = await prisma.wallet.findFirst({ where: { userId: uid, name: DEMO_WALLET } });
    if (!wallet) wallet = await prisma.wallet.create({ data: { userId: uid, name: DEMO_WALLET, balance } });
    else wallet = await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: balance } } });

    const categories = {};
    for (const [, , name, type] of DEMO_TRANSACTIONS) {
      categories[`${type}:${name}`] ??= await findOrCreateCategory(uid, name, type);
    }

    const day = 24 * 60 * 60 * 1000;
    await prisma.transaction.createMany({
      data: DEMO_TRANSACTIONS.map(([description, amount, name, type, daysAgo]) => ({
        userId: uid,
        walletId: wallet.id,
        categoryId: categories[`${type}:${name}`].id,
        description,
        amount,
        type,
        tags: [DEMO_TAG],
        date: new Date(Date.now() - daysAgo * day),
      })),
    });

    res.status(201).json({ created: DEMO_TRANSACTIONS.length });
  } catch (error) {
    console.error('Erreur chargement données de démonstration:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const removeDemoData = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { count } = await prisma.transaction.deleteMany({ where: { userId: uid, tags: { has: DEMO_TAG } } });
    // Le portefeuille démo n'est retiré que s'il ne contient plus aucune autre transaction
    const wallet = await prisma.wallet.findFirst({ where: { userId: uid, name: DEMO_WALLET } });
    if (wallet) {
      const remaining = await prisma.transaction.count({ where: { walletId: wallet.id } });
      if (remaining === 0) await prisma.wallet.delete({ where: { id: wallet.id } });
    }
    res.json({ removed: count });
  } catch (error) {
    console.error('Erreur suppression données de démonstration:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
