import { useEffect } from 'react';
import { getDisplayPrefs } from '../lib/format.js';

const AWAY_MS = 3 * 60 * 1000;

/**
 * Synchronisation automatique (Paramètres > Options de synchronisation) :
 * quand on revient sur l'onglet après quelques minutes, on recharge pour retrouver
 * les changements faits depuis un autre appareil. On ne recharge jamais pendant une saisie
 * ou lorsqu'une fenêtre modale est ouverte, pour ne rien faire perdre.
 */
export default function useAutoSync() {
  useEffect(() => {
    let hiddenAt = null;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (!hiddenAt || Date.now() - hiddenAt < AWAY_MS) return;
      hiddenAt = null;

      if (!getDisplayPrefs().autoSync) return;
      if (!(localStorage.getItem('token') || sessionStorage.getItem('token'))) return;
      const typing = document.activeElement?.matches?.('input, textarea, select');
      const modalOpen = document.querySelector('[role="dialog"], .fixed.inset-0');
      if (typing || modalOpen) return;
      window.location.reload();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
}
