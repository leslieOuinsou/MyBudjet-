import React, { useCallback, useEffect, useState } from 'react';
import { MdScience } from 'react-icons/md';
import { getDemoStatus, removeDemoData } from '../api.js';
import { useI18n } from '../context/I18nContext.jsx';

const hasToken = () => Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));

/** Bannière visible tant que des données de démonstration sont présentes, avec sortie en un clic. */
export default function DemoBanner() {
  const { t } = useI18n();
  const [demo, setDemo] = useState({ active: false, count: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!hasToken()) { setDemo({ active: false, count: 0 }); return; }
    getDemoStatus().then(setDemo).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('demo-changed', refresh);
    return () => window.removeEventListener('demo-changed', refresh);
  }, [refresh]);

  const exit = async () => {
    setBusy(true);
    try {
      await removeDemoData();
      window.dispatchEvent(new CustomEvent('transactions-changed'));
      window.dispatchEvent(new CustomEvent('demo-changed'));
    } catch { /* la bannière reste affichée, nouvelle tentative possible */ }
    setBusy(false);
  };

  if (!demo.active) return null;

  return (
    <div role="status" className="fixed z-40 top-0 inset-x-0 bg-amber-100 dark:bg-[#78350F] text-amber-900 dark:text-[#FDE68A] text-sm px-4 py-2 flex items-center justify-center gap-3 flex-wrap shadow">
      <MdScience size={18} className="shrink-0" />
      <span>{t('demo.banner', { n: demo.count })}</span>
      <button disabled={busy} onClick={exit} className="px-3 py-1 rounded-lg bg-amber-600 dark:bg-[#F59E0B] text-white dark:text-[#451A03] font-semibold disabled:opacity-60">
        {busy ? t('demo.exiting') : t('demo.exit')}
      </button>
    </div>
  );
}
