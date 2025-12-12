import BillReminder from '../models/billReminder.js';
import nodemailer from 'nodemailer';

export const getReminders = async (req, res) => {
  const reminders = await BillReminder.find({ user: req.user._id }).populate('category wallet');
  res.json(reminders);
};

export const createReminder = async (req, res) => {
  const { name, amount, dueDate, category, wallet, note } = req.body;
  const reminder = new BillReminder({ user: req.user._id, name, amount, dueDate, category, wallet, note });
  await reminder.save();
  res.status(201).json(reminder);
};

export const updateReminder = async (req, res) => {
  const { name, amount, dueDate, category, wallet, note } = req.body;
  const reminder = await BillReminder.findByIdAndUpdate(req.params.id, { name, amount, dueDate, category, wallet, note }, { new: true });
  if (!reminder) return res.status(404).json({ message: 'Rappel non trouvé' });
  res.json(reminder);
};

export const deleteReminder = async (req, res) => {
  await BillReminder.findByIdAndDelete(req.params.id);
  res.json({ message: 'Rappel supprimé' });
};

export const processReminders = async (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 jours
  const reminders = await BillReminder.find({ dueDate: { $lte: soon, $gte: now }, reminded: false });
  for (const r of reminders) {
    const user = await import('../models/user.js').then(m => m.default.findById(r.user));
    if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        await transporter.sendMail({
          to: user.email,
          subject: 'Rappel de facture à payer',
          text: `La facture "${r.name}" de ${r.amount} € est à payer avant le ${r.dueDate.toLocaleDateString()}`
        });
        r.reminded = true;
        await r.save();
        console.log('✅ Email de rappel envoyé à', user.email);
      } catch (err) {
        console.error('⚠️ Erreur envoi email (ignorée):', err.message);
      }
    }
  }
  res.json({ message: 'Rappels envoyés', count: reminders.length });
};
