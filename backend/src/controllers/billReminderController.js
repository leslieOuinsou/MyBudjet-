import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';
import nodemailer from 'nodemailer';

export const getReminders = async (req, res) => {
  const reminders = serialize(
    await prisma.billReminder.findMany({
      where: { userId: userId(req.user) },
      include: { category: true, wallet: true },
    })
  );
  res.json(reminders);
};

export const createReminder = async (req, res) => {
  const { name, amount, dueDate, category, wallet, note } = req.body;
  const reminder = serialize(
    await prisma.billReminder.create({
      data: {
        userId: userId(req.user),
        name,
        amount,
        dueDate: new Date(dueDate),
        categoryId: category || null,
        walletId: wallet || null,
        note,
      },
      include: { category: true, wallet: true },
    })
  );
  res.status(201).json(reminder);
};

export const updateReminder = async (req, res) => {
  const { name, amount, dueDate, category, wallet, note } = req.body;
  try {
    const reminder = serialize(
      await prisma.billReminder.update({
        where: { id: req.params.id },
        data: {
          name,
          amount,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          categoryId: category || null,
          walletId: wallet || null,
          note,
        },
      })
    );
    res.json(reminder);
  } catch {
    return res.status(404).json({ message: 'Rappel non trouvé' });
  }
};

export const deleteReminder = async (req, res) => {
  await prisma.billReminder.delete({ where: { id: req.params.id } }).catch(() => null);
  res.json({ message: 'Rappel supprimé' });
};

export const processReminders = async (req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const reminders = await prisma.billReminder.findMany({
    where: {
      dueDate: { lte: soon, gte: now },
      reminded: false,
    },
  });

  for (const r of reminders) {
    const user = await prisma.user.findUnique({ where: { id: r.userId } });
    if (user?.email && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          to: user.email,
          subject: 'Rappel de facture à payer',
          text: `La facture "${r.name}" de ${r.amount} € est à payer avant le ${r.dueDate.toLocaleDateString()}`,
        });
        await prisma.billReminder.update({
          where: { id: r.id },
          data: { reminded: true },
        });
        console.log('✅ Email de rappel envoyé à', user.email);
      } catch (err) {
        console.error('⚠️ Erreur envoi email (ignorée):', err.message);
      }
    }
  }
  res.json({ message: 'Rappels envoyés', count: reminders.length });
};
