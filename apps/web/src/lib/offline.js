// Mode hors ligne : les transactions saisies sans réseau sont gardées sur l'appareil puis envoyées au retour du réseau.
// Les données financières ne sont jamais mises en cache par le service worker ; seuls la file d'attente et la liste
// des catégories/portefeuilles (pour l'ajout rapide) sont stockés ici, rattachés au compte qui les a créés.
import { addTransaction } from '../api.js';

const QUEUE_KEY = 'mybudget_tx_queue';
const REFDATA_KEY = 'mybudget_refdata';
const EVENT = 'offline-queue-changed';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage plein ou indisponible
  }
};

/** Identifiant du compte connecté, lu dans le jeton (sans vérification : sert uniquement à rattacher les données locales). */
export function currentOwner() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.id || payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

const notify = () => window.dispatchEvent(new CustomEvent(EVENT));
export const onQueueChange = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};

// ---- Catégories / portefeuilles ----
export function cacheRefData({ categories, wallets }) {
  const owner = currentOwner();
  if (owner) write(REFDATA_KEY, { owner, categories, wallets });
}
export function getCachedRefData() {
  const data = read(REFDATA_KEY, null);
  return data && data.owner === currentOwner() ? data : null;
}

// ---- File d'attente ----
const allItems = () => read(QUEUE_KEY, []);

/** Éléments en attente du compte connecté. */
export const getQueue = () => {
  const owner = currentOwner();
  return allItems().filter((item) => item.owner === owner);
};

export function queueTransaction(payload) {
  const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, owner: currentOwner(), payload, createdAt: Date.now() };
  write(QUEUE_KEY, [...allItems(), item]);
  notify();
  return item;
}

export function discardQueued(id) {
  write(QUEUE_KEY, allItems().filter((item) => item.id !== id));
  notify();
}

const isNetworkError = (error) => error instanceof TypeError || !navigator.onLine;

let flushing = false;

/**
 * Envoie les transactions en attente du compte connecté, dans l'ordre.
 * Panne réseau : on s'arrête, tout reste en file. Refus du serveur : l'élément est marqué `error` et conservé.
 * Retourne { synced, failed }.
 */
export async function flushQueue() {
  const result = { synced: 0, failed: 0 };
  if (flushing || !navigator.onLine) return result;
  flushing = true;
  try {
    for (const item of getQueue()) {
      if (item.error) continue;
      try {
        await addTransaction(item.payload);
        write(QUEUE_KEY, allItems().filter((i) => i.id !== item.id));
        result.synced += 1;
      } catch (error) {
        if (isNetworkError(error)) break;
        write(QUEUE_KEY, allItems().map((i) => (i.id === item.id ? { ...i, error: error.message } : i)));
        result.failed += 1;
      }
    }
  } finally {
    flushing = false;
    notify();
  }
  if (result.synced) window.dispatchEvent(new CustomEvent('transactions-changed'));
  return result;
}

export { isNetworkError };
