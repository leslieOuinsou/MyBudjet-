import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MdAccountBalanceWallet, MdAddCircle, MdEventNote, MdInstallMobile, MdScience, MdWavingHand } from 'react-icons/md';
import { loadDemoData } from '../api.js';
import { currentOwner } from '../lib/offline.js';
import { useI18n } from '../context/I18nContext.jsx';
import { manualInstallHint, promptInstall, useCanInstall, useIsInstalled } from '../lib/install.js';

const STEPS = [
  { key: 'welcome', icon: MdWavingHand },
  { key: 'quick', icon: MdAddCircle },
  { key: 'budgets', icon: MdAccountBalanceWallet },
  { key: 'reminders', icon: MdEventNote },
  { key: 'install', icon: MdInstallMobile },
  { key: 'demo', icon: MdScience },
];

const flagKey = () => `mybudget_onboarded_${currentOwner()}`;
const seen = () => { try { return localStorage.getItem(flagKey()) === '1'; } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(flagKey(), '1'); } catch { /* stockage indisponible */ } };

/** Visite guidée de première connexion (rejouable via l'événement `start-tour`). */
export default function Onboarding() {
  const { t } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [demoState, setDemoState] = useState('idle'); // idle | loading | done | error
  const canInstall = useCanInstall();
  const isInstalled = useIsInstalled();

  // Première visite du tableau de bord après connexion
  useEffect(() => {
    if (location.pathname === '/dashboard' && currentOwner() && !seen()) {
      setStep(0);
      setOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const start = () => { setStep(0); setDemoState('idle'); setOpen(true); };
    window.addEventListener('start-tour', start);
    return () => window.removeEventListener('start-tour', start);
  }, []);

  const close = useCallback(() => {
    markSeen();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const loadDemo = async () => {
    setDemoState('loading');
    try {
      await loadDemoData();
      setDemoState('done');
      window.dispatchEvent(new CustomEvent('transactions-changed'));
      window.dispatchEvent(new CustomEvent('demo-changed'));
    } catch (err) {
      // Déjà chargées : même résultat pour l'utilisateur
      setDemoState(/déjà chargées/i.test(err.message) ? 'done' : 'error');
    }
  };

  if (!open) return null;
  const { key, icon: Icon } = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] shadow-2xl p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#DBEAFE] dark:bg-[#1E40AF]/40 flex items-center justify-center mb-4">
          <Icon size={34} className="text-[#2563EB] dark:text-[#60A5FA]" />
        </div>
        <h2 id="tour-title" className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">{t(`tour.${key}Title`)}</h2>
        <p className="mt-2 text-gray-600 dark:text-[#CBD5E1]">{t(`tour.${key}Text`)}</p>

        {key === 'install' && isInstalled && (
          <p role="status" className="mt-4 text-sm font-semibold text-green-700 dark:text-[#4ADE80]">{t('install.done')}</p>
        )}
        {key === 'install' && !canInstall && manualInstallHint() && (
          <p className="mt-3 text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">{t(`install.hint.${manualInstallHint()}`)}</p>
        )}
        {key === 'install' && canInstall && (
          <button onClick={promptInstall} className="mt-4 px-5 py-2.5 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold">{t('install.button')}</button>
        )}

        {key === 'demo' && (
          <div className="mt-4">
            <button
              onClick={loadDemo}
              disabled={demoState === 'loading' || demoState === 'done'}
              className="px-5 py-2.5 rounded-xl bg-[#22C55E] text-white font-semibold disabled:opacity-60"
            >
              {demoState === 'done' ? t('tour.demoLoaded') : t('tour.demoLoad')}
            </button>
            {demoState === 'error' && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-[#F87171]">{t('tour.demoError')}</p>}
          </div>
        )}

        <div className="flex justify-center gap-1.5 mt-5" aria-hidden="true">
          {STEPS.map((s, i) => <span key={s.key} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[#2563EB] dark:bg-[#3B82F6]' : 'w-1.5 bg-gray-300 dark:bg-[#475569]'}`} />)}
        </div>
        <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-2">{t('tour.step', { n: step + 1, total: STEPS.length })}</p>

        <div className="flex items-center justify-between mt-5">
          <button onClick={close} className="px-3 py-2 text-sm text-gray-500 dark:text-[#94A3B8] hover:underline">{t('tour.skip')}</button>
          <div className="flex gap-2">
            {step > 0 && <button onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-[#E2E8F0] bg-gray-100 dark:bg-[#334155]">{t('tour.back')}</button>}
            <button onClick={last ? close : () => setStep(step + 1)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]">
              {last ? t('tour.done') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
