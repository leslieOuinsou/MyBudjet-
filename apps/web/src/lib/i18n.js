// Traductions de l'interface (français / anglais). Les autres langues retombent sur le français.
// La langue vient des préférences d'affichage (Paramètres > Langue de l'interface).
import fr from '../i18n/fr.js';
import en from '../i18n/en.js';
import { getDisplayPrefs } from './format.js';

const DICTIONARIES = { fr, en };

export const getLanguage = () => (DICTIONARIES[getDisplayPrefs().language] ? getDisplayPrefs().language : 'fr');

/** Texte traduit ; `{nom}` est remplacé par vars.nom. Clé inconnue : texte français, sinon la clé. */
export function t(key, vars) {
  const text = DICTIONARIES[getLanguage()][key] ?? fr[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? `{${name}}`)) : text;
}
