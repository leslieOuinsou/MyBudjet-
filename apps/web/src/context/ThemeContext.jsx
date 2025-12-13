import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Forcer le mode clair uniquement
  useEffect(() => {
    // S'assurer que la classe dark n'est jamais ajoutée
    document.documentElement.classList.remove('dark');
  }, []);

  const value = {
    theme: 'light',
    effectiveTheme: 'light',
    toggleTheme: async () => ({ success: true }), // Fonction vide pour compatibilité
    loading: false,
    isDark: false,
    isDarkMode: false, // Alias pour compatibilité
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

