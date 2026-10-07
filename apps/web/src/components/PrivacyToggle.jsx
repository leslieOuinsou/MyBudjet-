import React from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { usePrivacy } from '../context/PrivacyContext.jsx';

// Bouton œil : masque / affiche tous les montants
export default function PrivacyToggle({ className = '' }) {
  const { hidden, toggle } = usePrivacy();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? 'Afficher les montants' : 'Masquer les montants'}
      title={hidden ? 'Afficher les montants' : 'Masquer les montants'}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${
        hidden
          ? 'bg-[#2563EB] text-white dark:bg-[#3B82F6]'
          : 'text-gray-600 dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#334155]'
      } ${className}`}
    >
      {hidden ? <MdVisibilityOff /> : <MdVisibility />}
    </button>
  );
}
