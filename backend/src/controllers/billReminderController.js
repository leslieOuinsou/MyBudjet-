import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';
import nodemailer from 'nodemailer';
import { createBillReminderNotification } from '../utils/notificationGenerator.js';

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

/**
 * Scan des factures à échéance proche (≤ 3 jours).
 * Crée une notification in-app (si l'option « Rappels de Factures » est activée)
 * et envoie un e-mail si le service est configuré.
 * Réutilisable par le cron Vercel et par la route manuelle /process.
 */
export const runBillReminderScan = async ({ userId: onlyUserId } = {}) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const reminders = await prisma.billReminder.findMany({
    where: {
      dueDate: { lte: soon, gte: now },
      reminded: false,
      ...(onlyUserId ? { userId: onlyUserId } : {}),
    },
  });

  let notificationsCreated = 0;
  let emailsSent = 0;

  for (const r of reminders) {
    // 1. Notification in-app — respecte la préférence « Rappels de Factures »
    const created = await createBillReminderNotification(r.userId, r.name, r.amount, r.dueDate);
    if (created) notificationsCreated++;

    // 2. E-mail si configuré
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
        emailsSent++;
        console.log('✅ Email de rappel envoyé à', user.email);
      } catch (err) {
        console.error('⚠️ Erreur envoi email (ignorée):', err.message);
      }
    }

    // 3. Marquer comme traitée (évite de re-notifier chaque jour)
    await prisma.billReminder.update({
      where: { id: r.id },
      data: { reminded: true },
    }).catch(() => null);
  }

  return { scanned: reminders.length, notificationsCreated, emailsSent };
};

export const processReminders = async (req, res) => {
  const result = await runBillReminderScan();
  res.json({ message: 'Rappels traités', ...result });
};
