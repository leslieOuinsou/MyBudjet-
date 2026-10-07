// Préférences d'affichage (Paramètres > Préférences de l'application) appliquées à toute l'appli.
// Stockées en localStorage pour être disponibles dès le premier rendu, puis resynchronisées
// avec le serveur après connexion (loadDisplayPrefs).
import { getUserSettings } from '../api.js';

const KEY = 'mybudget_display_prefs';
const DEFAULTS = { currency: 'EUR', dateFormat: 'DD/MM/YYYY', language: 'fr', autoSync: false, theme: 'light' };
const LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE' };

const read = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
};

let prefs = read();
if (typeof document !== 'undefined') document.documentElement.lang = prefs.language;

export const getDisplayPrefs = () => prefs;
export const getLocale = () => LOCALES[prefs.language] || 'fr-FR';

export function setDisplayPrefs(partial) {
  const next = { ...prefs };
  for (const k of Object.keys(DEFAULTS)) if (partial?.[k] !== undefined) next[k] = partial[k];
  prefs = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // stockage indisponible : les préférences restent valables pour la session
  }
  if (typeof document !== 'undefined') document.documentElement.lang = prefs.language;
  // Le thème du compte est appliqué par ThemeProvider
  if (partial?.theme && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('theme-pref', { detail: partial.theme }));
}

/** Récupère les préférences du compte (appearance + data.autoBackup) et les applique. */
export async function loadDisplayPrefs() {
  const settings = await getUserSettings();
  setDisplayPrefs({ ...settings?.appearance, autoSync: Boolean(settings?.data?.autoBackup) });
}

export const currencySymbol = (currency = prefs.currency) =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value || currency;

// Mode confidentialité : les montants sont masqués à l'écran (métro, bureau partagé)
const PRIVACY_KEY = 'mybudget_privacy';
let privacyOn = false;
try { privacyOn = localStorage.getItem(PRIVACY_KEY) === '1'; } catch { /* stockage indisponible */ }
export const isPrivacyOn = () => privacyOn;
export function setPrivacyOn(value) {
  privacyOn = Boolean(value);
  try { localStorage.setItem(PRIVACY_KEY, privacyOn ? '1' : '0'); } catch { /* stockage indisponible */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('privacy-changed', { detail: privacyOn }));
}

/** Montant dans la devise choisie. Les montants stockés ne sont pas convertis : seul l'affichage change. */
export function formatMoney(value, { currency = prefs.currency, compact = false } = {}) {
  if (privacyOn) return `•••• ${currencySymbol(currency)}`;
  const n = Number(value) || 0;
  return new Intl.NumberFormat(getLocale(), {
    style: 'currency',
    currency,
    ...(compact ? { maximumFractionDigits: 0, notation: Math.abs(n) >= 10000 ? 'compact' : 'standard' } : {}),
  }).format(n);
}

/** Date au format choisi (JJ/MM/AAAA, MM/JJ/AAAA ou AAAA-MM-JJ). */
export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (prefs.dateFormat === 'MM/DD/YYYY') return `${mm}/${dd}/${yyyy}`;
  if (prefs.dateFormat === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${dd}/${mm}/${yyyy}`;
}
