import React from 'react';
import { MdDarkMode, MdLightMode, MdBrightnessAuto } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext.jsx';

// Interrupteur identique à ceux des notifications (vert quand activé)
const Switch = ({ on, onChange, label, disabled = false }) => (
  <label className={`inline-flex items-center shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
    <input type="checkbox" checked={on} onChange={onChange} disabled={disabled} className="sr-only" aria-label={label} />
    <span className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 ${on ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#475569]'}`}>
      <span className={`bg-white w-5 h-5 rounded-full shadow transform duration-300 ${on ? 'translate-x-5' : ''}`} />
    </span>
  </label>
);

const Row = ({ icon: Icon, title, description, children, compact }) => (
  <div className={`flex items-center justify-between gap-3 ${compact ? 'py-1.5' : 'py-3'}`}>
    <div className="flex items-start gap-3 min-w-0">
      <Icon className="text-xl mt-0.5 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" />
      <div className="min-w-0">
        <div className={`font-semibold text-[#0F172A] dark:text-[#F8FAFC] ${compact ? 'text-sm' : ''}`}>{title}</div>
        {description && <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{description}</div>}
      </div>
    </div>
    {children}
  </div>
);

/**
 * Réglage du thème sous forme d'interrupteurs :
 *  - « Mode sombre » : activé = sombre, désactivé = clair
 *  - « Automatique » : suit le réglage de l'appareil (l'interrupteur sombre est alors informatif)
 */
export default function ThemeSwitch({ compact = false, showAuto = true }) {
  const { theme, effectiveTheme, toggleTheme } = useTheme();
  const auto = theme === 'auto';
  const dark = effectiveTheme === 'dark';

  return (
    <div className="divide-y divide-gray-100 dark:divide-[#334155]">
      <Row
        compact={compact}
        icon={dark ? MdDarkMode : MdLightMode}
        title="Mode sombre"
        description={compact ? undefined : 'Fond sombre, plus reposant le soir et dans le noir.'}
      >
        <Switch on={dark} disabled={auto} label="Mode sombre" onChange={() => toggleTheme(dark ? 'light' : 'dark')} />
      </Row>
      {showAuto && (
        <Row
          compact={compact}
          icon={MdBrightnessAuto}
          title="Automatique"
          description={compact ? undefined : 'Suit le réglage clair / sombre de votre appareil.'}
        >
          <Switch on={auto} label="Thème automatique" onChange={() => toggleTheme(auto ? (dark ? 'dark' : 'light') : 'auto')} />
        </Row>
      )}
    </div>
  );
}
