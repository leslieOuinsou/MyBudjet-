import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { updateUserSettings } from '../api.js';

const ThemeContext = createContext();
const KEY = 'mybudget_theme';
const MODES = ['light', 'dark', 'auto'];

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const readStored = () => {
  try {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : 'light';
  } catch {
    return 'light';
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const resolve = (theme) => (theme === 'auto' ? (systemPrefersDark() ? 'dark' : 'light') : theme);

// Applique la classe `dark` (Tailwind) et la couleur de la barre du navigateur
const apply = (effective) => {
  const root = document.documentElement;
  root.classList.toggle('dark', effective === 'dark');
  root.style.colorScheme = effective;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective === 'dark' ? '#0F172A' : '#2563EB');
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readStored);
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolve(readStored()));

  useEffect(() => {
    const effective = resolve(theme);
    setEffectiveTheme(effective);
    apply(effective);
    if (theme !== 'auto') return undefined;
    // Mode automatique : suit le réglage du téléphone / de l'ordinateur en direct
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { const e = resolve('auto'); setEffectiveTheme(e); apply(e); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  // Préférence du compte (chargée après connexion, voir lib/format.js)
  useEffect(() => {
    const fromServer = (e) => {
      if (MODES.includes(e.detail) && e.detail !== theme) {
        try { localStorage.setItem(KEY, e.detail); } catch { /* stockage indisponible */ }
        setTheme(e.detail);
      }
    };
    window.addEventListener('theme-pref', fromServer);
    return () => window.removeEventListener('theme-pref', fromServer);
  }, [theme]);

  const toggleTheme = useCallback(async (next) => {
    const value = MODES.includes(next) ? next : (effectiveTheme === 'dark' ? 'light' : 'dark');
    try { localStorage.setItem(KEY, value); } catch { /* stockage indisponible */ }
    setTheme(value);
    // Mémorisé aussi sur le compte pour retrouver le thème sur un autre appareil
    if (localStorage.getItem('token') || sessionStorage.getItem('token')) {
      try { await updateUserSettings({ appearance: { theme: value } }); } catch { /* le choix local reste valable */ }
    }
    return { success: true };
  }, [effectiveTheme]);

  const value = {
    theme,
    effectiveTheme,
    toggleTheme,
    loading: false,
    isDark: effectiveTheme === 'dark',
    isDarkMode: effectiveTheme === 'dark', // Alias pour compatibilité
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
