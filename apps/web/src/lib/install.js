import { useSyncExternalStore } from 'react';

// L'événement `beforeinstallprompt` n'est émis qu'une fois, au chargement : on le garde au niveau du module
// pour que le tutoriel, la bannière et le profil puissent tous déclencher l'installation (mobile et ordinateur).
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener('appinstalled', () => { deferred = null; emit(); });
}

export const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => deferred;

/** Installation possible en un clic (Chrome/Edge sur ordinateur et Android). */
export function useCanInstall() {
  return Boolean(useSyncExternalStore(subscribe, getSnapshot)) && !isStandalone();
}

export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  emit();
  event.prompt();
  const choice = await event.userChoice.catch(() => null);
  return choice?.outcome === 'accepted';
}
