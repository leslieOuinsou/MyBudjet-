// Notifications push : abonnement de l'appareil courant (service worker + clé VAPID du serveur).
import { getPushPublicKey, subscribePush, unsubscribePush } from '../api.js';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
/** iOS ne propose le push qu'aux applications installées sur l'écran d'accueil. */
export const needsInstallForPush = () => isIOS() && !isStandalone();

const urlBase64ToUint8Array = (base64) => {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

// Le service worker n'est enregistré qu'en production : en développement `ready` ne se résout jamais
async function getRegistration() {
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
  if (!registration) throw new Error('UNAVAILABLE');
  return registration;
}

/** { permission, subscribed } pour l'appareil courant. */
export async function getPushState() {
  if (!pushSupported()) return { permission: 'unsupported', subscribed: false };
  try {
    const registration = await getRegistration();
    const sub = await registration.pushManager.getSubscription();
    return { permission: Notification.permission, subscribed: Boolean(sub), available: true };
  } catch {
    return { permission: Notification.permission, subscribed: false, available: false };
  }
}

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('DENIED');
  const registration = await getRegistration();
  const { publicKey } = await getPushPublicKey();
  const sub =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  await subscribePush(sub.toJSON());
}

export async function disablePush() {
  const registration = await getRegistration();
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  await unsubscribePush(sub.endpoint).catch(() => {});
  await sub.unsubscribe();
}
