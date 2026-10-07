import React, { useState } from 'react';
import { MdClose, MdInstallMobile } from 'react-icons/md';
import { useI18n } from '../context/I18nContext.jsx';
import { isIOS, isStandalone, promptInstall, useCanInstall } from '../lib/install.js';

const DISMISS_KEY = 'mybudget_install_dismissed';
const hasToken = () => Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));
const wasDismissed = () => { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; } };

/** Invite à installer l'application (Chrome/Edge/Android) ou explique comment le faire sur iPhone. */
export default function InstallPrompt() {
  const { t } = useI18n();
  const deferred = useCanInstall();
  const [hidden, setHidden] = useState(wasDismissed);

  const dismiss = () => {
    setHidden(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* stockage indisponible */ }
  };

  const install = () => promptInstall();

  const showIosHint = isIOS() && !isStandalone();
  if (hidden || isStandalone() || !hasToken() || (!deferred && !showIosHint)) return null;

  return (
    <div className="fixed z-40 inset-x-4 bottom-24 sm:left-auto sm:right-8 sm:bottom-28 sm:max-w-sm rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] shadow-xl p-4 flex gap-3" role="dialog" aria-label={t('install.title')}>
      <MdInstallMobile size={28} className="text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{t('install.title')}</p>
        <p className="text-sm text-gray-600 dark:text-[#CBD5E1] mt-0.5">{deferred ? t('install.text') : t('install.iosText')}</p>
        <div className="flex gap-2 mt-3">
          {deferred && <button onClick={install} className="px-4 py-1.5 rounded-lg bg-[#2563EB] dark:bg-[#3B82F6] text-white text-sm font-semibold">{t('install.button')}</button>}
          <button onClick={dismiss} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-[#CBD5E1] hover:bg-gray-100 dark:hover:bg-[#334155]">{t('install.later')}</button>
        </div>
      </div>
      <button onClick={dismiss} aria-label={t('quick.close')} className="self-start text-gray-400 hover:text-gray-600"><MdClose size={20} /></button>
    </div>
  );
}
