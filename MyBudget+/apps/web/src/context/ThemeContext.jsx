import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserSettings, updateUserSettings } from '../api.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // 'light', 'dark', ou 'auto'
  const [effectiveTheme, setEffectiveTheme] = useState('light'); // Le thème réellement appliqué
  const [loading, setLoading] = useState(true);

  // Charger le thème depuis le backend au montage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const settings = await getUserSettings();
          const savedTheme = settings?.appearance?.theme || 'light';
          setTheme(savedTheme);
          applyTheme(savedTheme);
        } else {
          // Si pas connecté, utiliser le localStorage
          const localTheme = localStorage.getItem('theme') || 'light';
          setTheme(localTheme);
          applyTheme(localTheme);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
        const localTheme = localStorage.getItem('theme') || 'light';
        setTheme(localTheme);
        applyTheme(localTheme);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Appliquer le thème
  const applyTheme = (newTheme) => {
    let themeToApply = newTheme;

    // Si mode auto, détecter la préférence système
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeToApply = prefersDark ? 'dark' : 'light';
    }

    setEffectiveTheme(themeToApply);

    // Appliquer la classe au document
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sauvegarder dans le localStorage
    localStorage.setItem('theme', newTheme);
  };

  // Changer le thème
  const toggleTheme = async (newTheme) => {
    try {
      console.log('🎨 Changement de thème vers:', newTheme);
      setTheme(newTheme);
      applyTheme(newTheme);

      // Sauvegarder dans le backend si connecté
      const token = localStorage.getItem('token');
      if (token) {
        await updateUserSettings({
          appearance: { theme: newTheme }
        });
        console.log('✅ Thème enregistré dans le backend');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du thème:', error);
      return { success: false, error: error.message };
    }
  };

  // Écouter les changements de préférence système si mode auto
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const newEffectiveTheme = e.matches ? 'dark' : 'light';
        setEffectiveTheme(newEffectiveTheme);
        if (newEffectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const value = {
    theme,
    effectiveTheme,
    toggleTheme,
    loading,
    isDark: effectiveTheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

