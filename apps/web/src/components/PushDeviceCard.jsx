import React, { useCallback, useEffect, useState } from 'react';
import { MdNotificationsActive } from 'react-icons/md';
import { sendTestPush } from '../api.js';
import { disablePush, enablePush, getPushState, needsInstallForPush, pushSupported } from '../lib/push.js';
import { useI18n } from '../context/I18nContext.jsx';

/** Activation des notifications push sur l'appareil courant (Mon profil > Notifications). */
export default function PushDeviceCard() {
  const { t } = useI18n();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }

  const refresh = useCallback(() => getPushState().then(setState), []);
  useEffect(() => { refresh(); }, [refresh]);

  const run = async (action, okKey) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: t(okKey) });
    } catch (err) {
      setMessage({ ok: false, text: err.message === 'DENIED' ? t('push.denied') : err.message === 'UNAVAILABLE' ? t('push.unavailable') : err.message || t('push.error') });
    }
    await refresh();
    setBusy(false);
  };

  let status = null;
  if (!pushSupported()) status = needsInstallForPush() ? t('push.iosHint') : t('push.unsupported');
  else if (state?.permission === 'denied') status = t('push.denied');
  else if (state && state.available === false) status = t('push.unavailable');

  const btn = 'px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60';
  return (
    <div className="rounded-xl border border-gray-200 dark:border-[#334155] p-4 mb-4 bg-gray-50 dark:bg-[#0F172A]/40">
      <div className="flex items-start gap-3">
        <MdNotificationsActive size={26} className="text-[#2563EB] dark:text-[#60A5FA] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{t('push.title')}</div>
          <p className="text-sm text-gray-600 dark:text-[#CBD5E1] mt-0.5">{t('push.description')}</p>
          {status ? (
            <p className="text-sm mt-2 text-amber-700 dark:text-[#FBBF24]">{status}</p>
          ) : state && (
            <>
              <p className="text-sm mt-2 font-medium text-[#0F172A] dark:text-[#F8FAFC]">{state.subscribed ? t('push.on') : t('push.off')}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {state.subscribed ? (
                  <>
                    <button disabled={busy} onClick={() => run(sendTestPush, 'push.testSent')} className={`${btn} bg-[#2563EB] dark:bg-[#3B82F6] text-white`}>{t('push.test')}</button>
                    <button disabled={busy} onClick={() => run(disablePush, 'push.disabledOk')} className={`${btn} bg-gray-200 dark:bg-[#334155] text-gray-800 dark:text-[#E2E8F0]`}>{t('push.disable')}</button>
                  </>
                ) : (
                  <button disabled={busy} onClick={() => run(enablePush, 'push.enabledOk')} className={`${btn} bg-[#2563EB] dark:bg-[#3B82F6] text-white`}>{t('push.enable')}</button>
                )}
              </div>
            </>
          )}
          {message && <p role="status" className={`text-sm mt-2 ${message.ok ? 'text-green-700 dark:text-[#4ADE80]' : 'text-red-600 dark:text-[#F87171]'}`}>{message.text}</p>}
        </div>
      </div>
    </div>
  );
}
