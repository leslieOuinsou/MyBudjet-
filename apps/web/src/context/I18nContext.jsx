import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getLanguage, t } from '../lib/i18n.js';

const I18nContext = createContext({ lang: 'fr', t });

// Quand la langue change, `lang` change : App s'en sert comme clé pour redessiner tout l'écran
export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getLanguage);

  useEffect(() => {
    const sync = () => setLang(getLanguage());
    window.addEventListener('display-prefs-changed', sync);
    return () => window.removeEventListener('display-prefs-changed', sync);
  }, []);

  const translate = useCallback((key, vars) => t(key, vars), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return <I18nContext.Provider value={{ lang, t: translate }}>{children}</I18nContext.Provider>;
}
