import prisma from './prisma.js';

// Champs d'une transaction suivis dans l'historique
const TRACKED = ['amount', 'type', 'description', 'note', 'date', 'categoryId', 'walletId'];

export const snapshot = (t) => ({
  amount: t.amount,
  type: t.type,
  description: t.description,
  note: t.note || '',
  date: t.date,
  categoryId: t.categoryId || null,
  walletId: t.walletId || null,
});

/** Champs qui diffèrent entre deux instantanés : [{ field, from, to }] */
export function diff(before, after) {
  const same = (a, b) => (a instanceof Date || b instanceof Date ? new Date(a).getTime() === new Date(b).getTime() : a === b);
  return TRACKED.filter((f) => !same(before[f], after[f])).map((field) => ({ field, from: before[field], to: after[field] }));
}

/** Journalise une action. Ne bloque jamais l'opération métier. */
export async function logActivity({ userId, entity = 'transaction', entityId, action, summary, before, after }) {
  try {
    await prisma.activityLog.create({
      data: { userId, entity, entityId, action, summary, before: before ?? undefined, after: after ?? undefined },
    });
  } catch (error) {
    console.error('Erreur journal d\'activité:', error.message);
  }
}

const KIND = { expense: 'Dépense', income: 'Revenu' };
export const describe = (t) => `${KIND[t.type] || 'Transaction'} « ${t.description || 'sans libellé'} »`;
