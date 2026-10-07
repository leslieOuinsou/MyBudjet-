import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

const round2 = (n) => Math.round(n * 100) / 100;

const memberInclude = { user: { select: { id: true, name: true, email: true } } };

const findMemberBudget = (budgetId, uid) =>
  prisma.sharedBudget.findFirst({
    where: { id: budgetId, members: { some: { userId: uid } } },
    include: { members: { include: memberInclude } },
  });

/**
 * Soldes : positif = on doit recevoir, négatif = on doit payer.
 * Dépenses réparties à parts égales entre les membres actuels ; remboursements pris en compte.
 */
const computeBalances = (members, expenses, settlements) => {
  const balances = Object.fromEntries(members.map((m) => [m.userId, 0]));
  const share = members.length || 1;

  for (const e of expenses) {
    if (e.paidById in balances) balances[e.paidById] += e.amount;
    for (const m of members) balances[m.userId] -= e.amount / share;
  }
  for (const s of settlements) {
    if (s.fromUserId in balances) balances[s.fromUserId] += s.amount;
    if (s.toUserId in balances) balances[s.toUserId] -= s.amount;
  }
  return balances;
};

// Réduit les soldes en une liste minimale de « X doit Y € à Z »
const computeTransfers = (balances) => {
  const debtors = [];
  const creditors = [];
  for (const [id, b] of Object.entries(balances)) {
    if (b < -0.005) debtors.push({ id, amount: -b });
    else if (b > 0.005) creditors.push({ id, amount: b });
  }
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    transfers.push({ from: debtors[i].id, to: creditors[j].id, amount: round2(amount) });
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }
  return transfers;
};

export const listSharedBudgets = async (req, res) => {
  const budgets = await prisma.sharedBudget.findMany({
    where: { members: { some: { userId: userId(req.user) } } },
    include: { members: { include: memberInclude }, _count: { select: { expenses: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(serialize(budgets));
};

export const createSharedBudget = async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Le nom est requis' });
  const uid = userId(req.user);

  const budget = await prisma.sharedBudget.create({
    data: {
      name,
      currency: String(req.body.currency || 'EUR').toUpperCase().slice(0, 3),
      ownerId: uid,
      members: { create: { userId: uid } },
    },
    include: { members: { include: memberInclude } },
  });
  res.status(201).json(serialize(budget));
};

export const getSharedBudget = async (req, res) => {
  const uid = userId(req.user);
  const budget = await findMemberBudget(req.params.id, uid);
  if (!budget) return res.status(404).json({ message: 'Budget partagé introuvable' });

  const [expenses, settlements] = await Promise.all([
    prisma.sharedExpense.findMany({
      where: { sharedBudgetId: budget.id },
      include: { paidBy: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    }),
    prisma.sharedSettlement.findMany({ where: { sharedBudgetId: budget.id } }),
  ]);

  const balances = computeBalances(budget.members, expenses, settlements);
  const names = Object.fromEntries(budget.members.map((m) => [m.userId, m.user.name]));
  const transfers = computeTransfers(balances).map((t) => ({
    ...t,
    fromName: names[t.from],
    toName: names[t.to],
  }));

  res.json(
    serialize({
      ...budget,
      expenses,
      total: round2(expenses.reduce((s, e) => s + e.amount, 0)),
      balances: Object.entries(balances).map(([id, b]) => ({ userId: id, name: names[id], balance: round2(b) })),
      transfers,
    })
  );
};

export const deleteSharedBudget = async (req, res) => {
  const result = await prisma.sharedBudget.deleteMany({ where: { id: req.params.id, ownerId: userId(req.user) } });
  if (result.count === 0) return res.status(404).json({ message: 'Budget introuvable ou vous n’en êtes pas le propriétaire' });
  res.json({ message: 'Budget partagé supprimé' });
};

export const addMember = async (req, res) => {
  const uid = userId(req.user);
  const budget = await prisma.sharedBudget.findFirst({ where: { id: req.params.id, ownerId: uid } });
  if (!budget) return res.status(404).json({ message: 'Budget introuvable ou vous n’en êtes pas le propriétaire' });

  const email = String(req.body.email || '').trim().toLowerCase();
  const invited = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!invited) return res.status(404).json({ message: 'Aucun utilisateur MyBudget avec cet email' });

  const exists = await prisma.sharedBudgetMember.findFirst({ where: { sharedBudgetId: budget.id, userId: invited.id } });
  if (exists) return res.status(409).json({ message: 'Cette personne est déjà membre' });

  await prisma.sharedBudgetMember.create({ data: { sharedBudgetId: budget.id, userId: invited.id } });
  res.status(201).json({ message: `${invited.name} a été ajouté(e)` });
};

export const removeMember = async (req, res) => {
  const uid = userId(req.user);
  const budget = await findMemberBudget(req.params.id, uid);
  if (!budget) return res.status(404).json({ message: 'Budget introuvable' });

  const targetId = req.params.userId;
  // Seul le propriétaire retire quelqu'un ; chacun peut se retirer lui-même (sauf le propriétaire)
  if (targetId !== uid && budget.ownerId !== uid) return res.status(403).json({ message: 'Action réservée au propriétaire' });
  if (targetId === budget.ownerId) return res.status(400).json({ message: 'Le propriétaire ne peut pas quitter le budget : supprimez-le' });

  await prisma.sharedBudgetMember.deleteMany({ where: { sharedBudgetId: budget.id, userId: targetId } });
  res.json({ message: 'Membre retiré' });
};

export const addExpense = async (req, res) => {
  const uid = userId(req.user);
  const budget = await findMemberBudget(req.params.id, uid);
  if (!budget) return res.status(404).json({ message: 'Budget introuvable' });

  const amount = parseFloat(req.body.amount);
  const description = String(req.body.description || '').trim();
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
  if (!description) return res.status(400).json({ message: 'La description est requise' });

  const paidById = req.body.paidById || uid;
  if (!budget.members.some((m) => m.userId === paidById)) {
    return res.status(400).json({ message: 'Le payeur doit être membre du budget' });
  }

  const expense = await prisma.sharedExpense.create({
    data: {
      sharedBudgetId: budget.id,
      paidById,
      amount,
      description,
      date: req.body.date ? new Date(req.body.date) : new Date(),
    },
  });
  res.status(201).json(serialize(expense));
};

export const deleteExpense = async (req, res) => {
  const uid = userId(req.user);
  const budget = await findMemberBudget(req.params.id, uid);
  if (!budget) return res.status(404).json({ message: 'Budget introuvable' });

  const result = await prisma.sharedExpense.deleteMany({ where: { id: req.params.expenseId, sharedBudgetId: budget.id } });
  if (result.count === 0) return res.status(404).json({ message: 'Dépense introuvable' });
  res.json({ message: 'Dépense supprimée' });
};

// Enregistre qu'un membre a remboursé un autre
export const addSettlement = async (req, res) => {
  const uid = userId(req.user);
  const budget = await findMemberBudget(req.params.id, uid);
  if (!budget) return res.status(404).json({ message: 'Budget introuvable' });

  const amount = parseFloat(req.body.amount);
  const { toUserId } = req.body;
  const ids = budget.members.map((m) => m.userId);
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
  if (!ids.includes(toUserId) || toUserId === uid) return res.status(400).json({ message: 'Destinataire invalide' });

  const settlement = await prisma.sharedSettlement.create({
    data: { sharedBudgetId: budget.id, fromUserId: uid, toUserId, amount },
  });
  res.status(201).json(serialize(settlement));
};
