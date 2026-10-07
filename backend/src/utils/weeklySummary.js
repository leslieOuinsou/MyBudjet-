import prisma from '../lib/prisma.js';
import { isNotificationAllowed, createWeeklySummaryNotification } from './notificationGenerator.js';

/**
 * Génère le résumé hebdomadaire (dépenses / revenus / taux d'épargne)
 * pour chaque utilisateur ayant activé « Rapports Hebdomadaires ».
 * Réutilisable par le cron Vercel.
 */
export const runWeeklySummaryScan = async ({ userId: onlyUserId } = {}) => {
  // Semaine en cours : du lundi 00h00 à maintenant
  const now = new Date();
  const day = now.getDay(); // 0 = dimanche
  const daysSinceMonday = (day + 6) % 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);

  // Utilisateurs ayant activé le résumé hebdomadaire
  const prefsList = await prisma.notificationPreferences.findMany({
    where: {
      preferences: { path: ['weekly'], equals: true },
      ...(onlyUserId ? { userId: onlyUserId } : {}),
    },
    select: { userId: true },
  });

  let summariesCreated = 0;

  for (const { userId } of prefsList) {
    // Double vérification (la préférence peut être un objet incomplet)
    if (!(await isNotificationAllowed(userId, 'weekly'))) continue;

    const [spent, income] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'expense', date: { gte: weekStart } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'income', date: { gte: weekStart } },
        _sum: { amount: true },
      }),
    ]);

    const totalSpent = Math.round(spent._sum.amount || 0);
    const totalIncome = Math.round(income._sum.amount || 0);
    const savingsRate = totalIncome > 0
      ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100)
      : 0;

    const created = await createWeeklySummaryNotification(userId, totalSpent, totalIncome, savingsRate);
    if (created) summariesCreated++;
  }

  return { usersWithWeekly: prefsList.length, summariesCreated };
};
