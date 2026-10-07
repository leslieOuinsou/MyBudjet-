import prisma from '../lib/prisma.js';
import { createDocumentExpiryNotification } from './notificationGenerator.js';

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRY_WINDOW_DAYS = 30;

/**
 * Prévient l'utilisateur quand un document arrive à échéance (garantie, contrat, assurance…).
 * Une seule notification par date d'échéance : expiryRemindedAt est remis à zéro si la date change.
 */
export async function runDocumentExpiryScan() {
  const horizon = new Date(Date.now() + EXPIRY_WINDOW_DAYS * DAY);
  const docs = await prisma.document.findMany({
    where: { expiresAt: { not: null, lte: horizon }, expiryRemindedAt: null },
    select: { id: true, userId: true, name: true, expiresAt: true },
  });

  let notificationsCreated = 0;
  for (const doc of docs) {
    const daysLeft = Math.ceil((doc.expiresAt.getTime() - Date.now()) / DAY);
    const created = await createDocumentExpiryNotification(doc.userId, doc.name, doc.expiresAt, daysLeft);
    if (created) notificationsCreated += 1;
    // Marqué même si les notifications sont coupées par l'utilisateur : on ne relance pas chaque jour
    await prisma.document.update({ where: { id: doc.id }, data: { expiryRemindedAt: new Date() } }).catch(() => null);
  }
  return { scanned: docs.length, notificationsCreated };
}
