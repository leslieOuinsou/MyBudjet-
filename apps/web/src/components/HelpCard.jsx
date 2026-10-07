import React, { useCallback, useEffect, useState } from 'react';
import { MdScience } from 'react-icons/md';
import { getDemoStatus, loadDemoData, removeDemoData } from '../api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { promptInstall, useCanInstall } from '../lib/install.js';

/** Tutoriel et données de démonstration (Mon profil > Affichage). */
export default function HelpCard() {
  const { t } = useI18n();
  const canInstall = useCanInstall();
  const [demo, setDemo] = useState({ active: false, count: 0 });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(() => getDemoStatus().then(setDemo).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh]);

  const toggleDemo = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (demo.active) {
        await removeDemoData();
        setMessage(t('help.demoRemoved'));
      } else {
        await loadDemoData();
        setMessage(t('tour.demoLoaded'));
      }
      window.dispatchEvent(new CustomEvent('transactions-changed'));
      window.dispatchEvent(new CustomEvent('demo-changed'));
      await refresh();
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#334155] p-4 bg-gray-50 dark:bg-[#0F172A]/40">
      <div className="flex items-start gap-3">
        <MdScience size={26} className="text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{t('help.title')}</div>
          <p className="text-sm text-gray-600 dark:text-[#CBD5E1] mt-0.5">{t('help.description')}</p>
          {demo.active && <p className="text-sm mt-2 font-medium text-[#0F172A] dark:text-[#F8FAFC]">{t('help.demoActive', { n: demo.count })}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={() => window.dispatchEvent(new CustomEvent('start-tour'))} className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#2563EB] dark:bg-[#3B82F6] text-white">{t('help.replay')}</button>
            {canInstall && <button onClick={promptInstall} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-200 dark:bg-[#334155] text-gray-800 dark:text-[#E2E8F0]">{t('help.install')}</button>}
            <button disabled={busy} onClick={toggleDemo} className={`px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 ${demo.active ? 'bg-red-100 dark:bg-[#7F1D1D]/40 text-red-700 dark:text-[#FCA5A5]' : 'bg-gray-200 dark:bg-[#334155] text-gray-800 dark:text-[#E2E8F0]'}`}>
              {demo.active ? t('help.demoRemove') : t('help.demoLoad')}
            </button>
          </div>
          {message && <p role="status" className="text-sm mt-2 text-green-700 dark:text-[#4ADE80]">{message}</p>}
          {error && <p role="alert" className="text-sm mt-2 text-red-600 dark:text-[#F87171]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
