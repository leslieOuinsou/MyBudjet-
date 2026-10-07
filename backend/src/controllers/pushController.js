import prisma from '../lib/prisma.js';
import { userId as getUserId } from '../lib/serialize.js';
import { isPushConfigured, pushNotificationIfEnabled } from '../utils/pushService.js';

export const getPublicKey = (req, res) => {
  if (!isPushConfigured()) return res.status(503).json({ message: 'Notifications push non configurées' });
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

export const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body?.subscription || req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Abonnement push invalide' });
    }
    const uid = getUserId(req.user);
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: uid, p256dh: keys.p256dh, auth: keys.auth, userAgent: req.headers['user-agent'] || null },
      create: { endpoint, userId: uid, p256dh: keys.p256dh, auth: keys.auth, userAgent: req.headers['user-agent'] || null },
    });
    res.status(201).json({ subscribed: true });
  } catch (error) {
    console.error('Erreur abonnement push:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    const uid = getUserId(req.user);
    await prisma.pushSubscription.deleteMany({ where: { userId: uid, ...(endpoint ? { endpoint } : {}) } });
    res.json({ subscribed: false });
  } catch (error) {
    console.error('Erreur désabonnement push:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const sendTest = async (req, res) => {
  const sent = await pushNotificationIfEnabled(getUserId(req.user), {
    title: 'MyBudget',
    message: 'Les notifications push fonctionnent sur cet appareil.',
    type: 'system',
    url: '/dashboard',
  });
  if (!sent) return res.status(409).json({ message: 'Aucun appareil abonné (ou push désactivé dans vos préférences)' });
  res.json({ sent });
};
