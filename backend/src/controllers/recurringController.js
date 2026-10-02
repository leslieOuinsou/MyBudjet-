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

export const processRecurring = async (req, res) => {
  const now = new Date();
  const recs = await prisma.recurringTransaction.findMany({
    where: { nextDate: { lte: now } },
  });

  for (const rec of recs) {
    await prisma.transaction.create({
      data: {
        amount: rec.amount,
        type: rec.type,
        categoryId: rec.categoryId,
        walletId: rec.walletId,
        userId: rec.userId,
        description: rec.note || 'Transaction récurrente',
        note: rec.note,
        date: rec.nextDate,
        attachment: rec.attachment,
      },
    });

    const next = new Date(rec.nextDate);
    if (rec.frequency === 'daily') next.setDate(next.getDate() + 1);
    if (rec.frequency === 'weekly') next.setDate(next.getDate() + 7);
    if (rec.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    if (rec.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);

    if (rec.endDate && next > rec.endDate) {
      await prisma.recurringTransaction.delete({ where: { id: rec.id } });
    } else {
      await prisma.recurringTransaction.update({
        where: { id: rec.id },
        data: { nextDate: next },
      });
    }
  }
  res.json({ message: 'Transactions récurrentes générées' });
};
