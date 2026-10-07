// Google Analytics 4 : chargé uniquement avec le consentement « cookies analytiques » (RGPD).
// - Consent Mode : tout est refusé par défaut, accordé seulement si l'utilisateur accepte.
// - Application monopage : les pages vues sont envoyées à chaque changement de route (AnalyticsTracker).
// - Aucune donnée personnelle (e-mail, nom, jeton) n'est envoyée ; les URL sensibles sont nettoyées.
export const GA_ID = import.meta.env.VITE_GA_ID || 'G-294JZ864WM';

const CONSENT_KEY = 'cookieConsent';
let loaded = false;

function gtag() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments); // gtag.js exige l'objet `arguments`, pas un tableau
}

const hasAnalyticsConsent = () => {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}').analytics === true;
  } catch {
    return false;
  }
};

// Retire les jetons / identifiants des URL avant envoi
export function sanitizePath(pathname) {
  return pathname
    .replace(/^\/reset-password\/[^/]+/, '/reset-password/:token')
    .replace(/^\/auth\/google\/callback.*/, '/auth/google/callback')
    .replace(/\/[a-z0-9]{20,}(?=\/|$)/gi, '/:id');
}

function loadScript() {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

/** À appeler quand le choix de cookies change (et au démarrage avec le choix enregistré). */
export function setAnalyticsConsent(granted) {
  if (granted) {
    loadScript();
    window[`ga-disable-${GA_ID}`] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });
  } else if (loaded) {
    window[`ga-disable-${GA_ID}`] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }
}

export function initAnalytics() {
  if (hasAnalyticsConsent()) setAnalyticsConsent(true);
}

export function trackPageView(pathname) {
  if (!loaded || !hasAnalyticsConsent()) return;
  const path = sanitizePath(pathname);
  gtag('event', 'page_view', { page_path: path, page_location: `${window.location.origin}${path}`, page_title: document.title });
}

/** Événement métier, ex. trackEvent('document_uploaded', { category: 'facture' }). Sans effet sans consentement. */
export function trackEvent(name, params = {}) {
  if (!loaded || !hasAnalyticsConsent()) return;
  gtag('event', name, params);
}
