import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

export const getRecurring = async (req, res) => {
  const rec = serialize(
    await prisma.recurringTransaction.findMany({
      where: { userId: userId(req.user) },
      include: { category: true, wallet: true },
    })
  );
  res.json(rec);
};

export const createRecurring = async (req, res) => {
  const { amount, type, category, wallet, note, frequency, nextDate, endDate, attachment } = req.body;
  const rec = serialize(
    await prisma.recurringTransaction.create({
      data: {
        amount,
        type,
        categoryId: category || null,
        walletId: wallet || null,
        userId: userId(req.user),
        note,
        frequency,
        nextDate: new Date(nextDate),
        endDate: endDate ? new Date(endDate) : null,
        attachment,
      },
      include: { category: true, wallet: true },
    })
  );
  res.status(201).json(rec);
};

export const updateRecurring = async (req, res) => {
  const uid = userId(req.user);
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: req.params.id, userId: uid },
  });
  if (!existing) {
    return res.status(404).json({ message: 'Récurrence non trouvée' });
  }

  const { amount, type, category, wallet, note, frequency, nextDate, endDate, attachment } = req.body;
  const data = {};
  if (amount !== undefined) data.amount = parseFloat(amount);
  if (type !== undefined) data.type = type;
  if (category !== undefined) data.categoryId = category || null;
  if (wallet !== undefined) data.walletId = wallet || null;
  if (note !== undefined) data.note = note;
  if (frequency !== undefined) data.frequency = frequency;
  if (nextDate !== undefined) data.nextDate = new Date(nextDate);
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (attachment !== undefined) data.attachment = attachment;

  const rec = serialize(
    await prisma.recurringTransaction.update({
      where: { id: req.params.id },
      data,
      include: { category: true, wallet: true },
    })
  );
  res.json(rec);
};

export const deleteRecurring = async (req, res) => {
  const uid = userId(req.user);
  const result = await prisma.recurringTransaction.deleteMany({
    where: { id: req.params.id, userId: uid },
  });
  if (result.count === 0) {
    return res.status(404).json({ message: 'Récurrence non trouvée' });
  }
  res.json({ message: 'Récurrence supprimée' });
};

const advanceDate = (date, frequency) => {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
};

/**
 * Génère les transactions des récurrences échues (rattrape les périodes manquées).
 * Appelée par le cron quotidien ; `userId` limite le traitement à un utilisateur.
 */
export const runRecurringScan = async ({ userId: onlyUserId } = {}) => {
  const now = new Date();
  const recs = await prisma.recurringTransaction.findMany({
    where: { nextDate: { lte: now }, ...(onlyUserId ? { userId: onlyUserId } : {}) },
  });

  let created = 0;
  for (const rec of recs) {
    let date = new Date(rec.nextDate);
    let finished = false;

    while (date <= now) {
      if (rec.endDate && date > rec.endDate) {
        finished = true;
        break;
      }
      await prisma.transaction.create({
        data: {
          amount: rec.amount,
          type: rec.type,
          categoryId: rec.categoryId,
          walletId: rec.walletId,
          userId: rec.userId,
          description: rec.note || 'Transaction récurrente',
          note: rec.note,
          date,
          attachment: rec.attachment,
        },
      });
      created++;
      date = advanceDate(date, rec.frequency);
    }

    if (finished || (rec.endDate && date > rec.endDate)) {
      await prisma.recurringTransaction.delete({ where: { id: rec.id } });
    } else {
      await prisma.recurringTransaction.update({ where: { id: rec.id }, data: { nextDate: date } });
    }
  }
  return { processed: recs.length, created };
};

// Déclenchement manuel : limité aux récurrences de l'utilisateur connecté
export const processRecurring = async (req, res) => {
  const result = await runRecurringScan({ userId: userId(req.user) });
  res.json({ message: 'Transactions récurrentes générées', ...result });
};
