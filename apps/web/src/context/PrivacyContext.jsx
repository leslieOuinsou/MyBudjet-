import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { isPrivacyOn, setPrivacyOn } from '../lib/format.js';

const PrivacyContext = createContext({ hidden: false, toggle: () => {} });
export const usePrivacy = () => useContext(PrivacyContext);

// Le basculement redessine tout l'écran (clé sur les routes) : tous les montants passent par formatMoney
export function PrivacyProvider({ children }) {
  const [hidden, setHidden] = useState(isPrivacyOn);

  useEffect(() => {
    const sync = (e) => setHidden(Boolean(e.detail));
    window.addEventListener('privacy-changed', sync);
    return () => window.removeEventListener('privacy-changed', sync);
  }, []);

  const toggle = useCallback(() => setPrivacyOn(!isPrivacyOn()), []);
  return <PrivacyContext.Provider value={{ hidden, toggle }}>{children}</PrivacyContext.Provider>;
}
