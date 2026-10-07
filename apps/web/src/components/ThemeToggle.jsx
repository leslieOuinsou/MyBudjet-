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
        <span className="text-sm text-[#64748B] font-medium">Thème :</span>
      )}
      <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-lg p-1">
        {/* Light mode */}
        <button
          onClick={() => handleThemeChange('light')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
            theme === 'light'
              ? 'bg-[#2563EB] text-white'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
              ? 'bg-[#2563EB] text-white'
              : 'text-[#64748B] hover:text-[#0F172A]'
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
              ? 'bg-[#2563EB] text-white'
              : 'text-[#64748B] hover:text-[#0F172A]'
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

