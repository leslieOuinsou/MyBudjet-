import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

const ThemeToggle = ({ showLabel = true, className = '' }) => {
  const { theme, effectiveTheme, toggleTheme } = useTheme();

  const handleThemeChange = (newTheme) => {
    toggleTheme(newTheme);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-[#64748B] dark:text-[#94A3B8] font-medium">Thème :</span>
      )}
      <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#334155]/50 rounded-lg p-1">
        {/* Light mode */}
        <button
          onClick={() => handleThemeChange('light')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'light'
              ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
          }`}
          title="Mode clair"
        >
          ☀️
        </button>
        
        {/* Auto mode */}
        <button
          onClick={() => handleThemeChange('auto')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'auto'
              ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
          }`}
          title="Mode automatique"
        >
          🔄
        </button>
        
        {/* Dark mode */}
        <button
          onClick={() => handleThemeChange('dark')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'dark'
              ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white'
              : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
          }`}
          title="Mode sombre"
        >
          🌙
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;

