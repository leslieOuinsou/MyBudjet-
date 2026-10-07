import webpush from 'web-push';
import prisma from '../lib/prisma.js';

let configured = false;

const configure = () => {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:contact@mybudget.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
};

export const isPushConfigured = () => configure();

/**
 * Envoie une notification push à tous les appareils de l'utilisateur.
 * Ne lève jamais d'erreur : le push est un bonus, la notification existe déjà.
 * Les abonnements expirés (404/410) sont supprimés.
 */
export const pushNotificationIfEnabled = async (userId, { title, message, priority, type, url = '/notifications' }) => {
  try {
    if (!configure()) return 0;
    const [subs, prefs] = await Promise.all([
      prisma.pushSubscription.findMany({ where: { userId } }),
      prisma.userPreferences.findUnique({ where: { userId } }),
    ]);
    if (!subs.length || prefs?.notifications?.push === false) return 0;

    const payload = JSON.stringify({ title, body: message, priority, type, url });
    let sent = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 60 * 60 * 24 }
          );
          sent += 1;
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.error('Erreur envoi push:', error.statusCode || error.message);
          }
        }
      })
    );
    return sent;
  } catch (error) {
    console.error('Erreur push:', error.message);
    return 0;
  }
};
