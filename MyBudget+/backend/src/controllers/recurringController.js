import RecurringTransaction from '../models/recurringTransaction.js';
import Transaction from '../models/transaction.js';

export const getRecurring = async (req, res) => {
  const rec = await RecurringTransaction.find({ user: req.user?._id })
    .populate('category')
    .populate('wallet');
  res.json(rec);
};

export const createRecurring = async (req, res) => {
  const { amount, type, category, wallet, note, frequency, nextDate, endDate, attachment } = req.body;
  const rec = new RecurringTransaction({
    amount, type, category, wallet, user: req.user?._id, note, frequency, nextDate, endDate, attachment
  });
  await rec.save();
  res.status(201).json(rec);
};

export const deleteRecurring = async (req, res) => {
  await RecurringTransaction.findByIdAndDelete(req.params.id);
  res.json({ message: 'Récurrence supprimée' });
};

// À exécuter via cron ou endpoint manuel pour générer les transactions récurrentes
export const processRecurring = async (req, res) => {
  const now = new Date();
  const recs = await RecurringTransaction.find({ nextDate: { $lte: now } });
  for (const rec of recs) {
    await Transaction.create({
      amount: rec.amount,
      type: rec.type,
      category: rec.category,
      wallet: rec.wallet,
      user: rec.user,
      note: rec.note,
      date: rec.nextDate,
      attachment: rec.attachment,
    });
    // Calcule la prochaine date
    let next = new Date(rec.nextDate);
    if (rec.frequency === 'daily') next.setDate(next.getDate() + 1);
    if (rec.frequency === 'weekly') next.setDate(next.getDate() + 7);
    if (rec.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    if (rec.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
    rec.nextDate = next;
    if (rec.endDate && next > rec.endDate) {
      await RecurringTransaction.findByIdAndDelete(rec._id);
    } else {
      await rec.save();
    }
  }
  res.json({ message: 'Transactions récurrentes générées' });
};
