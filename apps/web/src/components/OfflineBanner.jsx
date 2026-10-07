import React, { useCallback, useEffect, useState } from 'react';
import { MdCloudOff, MdSync } from 'react-icons/md';
import { discardQueued, flushQueue, getQueue, onQueueChange } from '../lib/offline.js';
import { useI18n } from '../context/I18nContext.jsx';

const hasToken = () => Boolean(localStorage.getItem('token') || sessionStorage.getItem('token'));

/** Pastille « hors ligne » + transactions en attente d'envoi. */
export default function OfflineBanner() {
  const { t } = useI18n();
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(getQueue);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const sync = useCallback(async () => {
    if (!hasToken() || !getQueue().length) return;
    setSyncing(true);
    const { synced, failed } = await flushQueue();
    setSyncing(false);
    if (synced) setMessage(t('offline.synced', { n: synced }));
    else if (failed) setMessage(t('offline.failed', { n: failed }));
    if (synced) setTimeout(() => setMessage(''), 4000);
  }, [t]);

  useEffect(() => {
    const goOnline = () => { setOnline(true); sync(); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    const off = onQueueChange(() => setQueue(getQueue()));
    if (navigator.onLine) sync();
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      off();
    };
  }, [sync]);

  const rejected = queue.filter((item) => item.error);
  const waiting = queue.length - rejected.length;
  if (online && !queue.length && !message) return null;

  return (
    <div className="fixed z-40 left-4 bottom-4 max-w-[calc(100vw-6rem)] md:left-[19rem] rounded-2xl bg-[#0F172A] text-white text-sm shadow-lg px-4 py-3 space-y-2" role="status">
      {!online && <div className="flex items-center gap-2 font-semibold"><MdCloudOff size={18} /> {t('offline.banner')}</div>}
      {waiting > 0 && (
        <div className="flex items-center gap-3">
          <span>{t('offline.pending', { n: waiting })}</span>
          {online && (
            <button onClick={sync} disabled={syncing} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#3B82F6] font-semibold disabled:opacity-60">
              <MdSync className={syncing ? 'animate-spin' : ''} /> {syncing ? t('offline.syncing') : t('offline.sync')}
            </button>
          )}
        </div>
      )}
      {rejected.map((item) => (
        <div key={item.id} className="flex items-center gap-3 text-red-300">
          <span className="truncate">{t('offline.errorLabel')} : {item.payload.description} — {item.error}</span>
          <button onClick={() => discardQueued(item.id)} className="shrink-0 underline">{t('offline.discard')}</button>
        </div>
      ))}
      {message && <div>{message}</div>}
    </div>
  );
}
