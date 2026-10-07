import { useSyncExternalStore } from 'react';

// L'événement `beforeinstallprompt` n'est émis qu'une fois, au chargement : on le garde au niveau du module
// pour que le tutoriel, la bannière et le profil puissent tous déclencher l'installation (mobile et ordinateur).
const INSTALLED_KEY = 'mybudget_installed';
const readInstalled = () => { try { return localStorage.getItem(INSTALLED_KEY) === '1'; } catch { return false; } };
let deferred = null;
let installed = typeof window !== 'undefined' && readInstalled();
const markInstalled = () => {
  installed = true;
  try { localStorage.setItem(INSTALLED_KEY, '1'); } catch { /* stockage indisponible */ }
};
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; markInstalled(); emit(); });
}

export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => deferred;

/** Installation possible en un clic (Chrome/Edge sur ordinateur et Android). */
export function useCanInstall() {
  return Boolean(useSyncExternalStore(subscribe, getSnapshot)) && !isStandalone() && !installed;
}

/** L'application est déjà installée (ou ouverte en mode application) : plus aucune invitation à afficher. */
export function useIsInstalled() {
  return useSyncExternalStore(subscribe, () => installed || isStandalone());
}

export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  emit();
  event.prompt();
  const choice = await event.userChoice.catch(() => null);
  const accepted = choice?.outcome === 'accepted';
  if (accepted) { markInstalled(); emit(); }
  return accepted;
}

/** Consigne d'installation manuelle quand le navigateur ne propose pas de bouton (null si rien à dire). */
export function manualInstallHint() {
  if (isStandalone() || installed) return null;
  const ua = navigator.userAgent;
  if (isIOS()) return 'ios';
  if (/android/i.test(ua)) return /firefox/i.test(ua) ? 'firefoxAndroid' : null;
  if (/firefox/i.test(ua)) return 'firefox';
  if (/safari/i.test(ua) && !/chrome|chromium|edg|opr/i.test(ua) && /mac/i.test(ua)) return 'safari';
  return null;
}
