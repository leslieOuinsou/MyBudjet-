import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { setAnalyticsConsent, trackPageView } from '../lib/analytics.js';
import {
  MdCookie,
  MdSettings,
  MdCheck,
  MdClose,
  MdInfo,
  MdSecurity
} from 'react-icons/md';

/**
 * Composant de gestion du consentement des cookies RGPD
 * 
 * Fonctionnalités :
 * - Bannière de consentement conforme RGPD
 * - Gestion granulaire des préférences cookies
 * - Sauvegarde dans localStorage
 * - Design moderne et responsive
 * - Support mode sombre
 */
export default function CookieConsent() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  // États pour gérer l'affichage de la bannière et des préférences
  const [showBanner, setShowBanner] = useState(false); // showBanner: affiche ou masque la bannière principale
  const [showSettings, setShowSettings] = useState(false); // showSettings: affiche ou masque le panneau de paramètres détaillés
  
  // État pour gérer les préférences de cookies (nécessaires, analytiques, marketing)
  const [preferences, setPreferences] = useState({
    necessary: true, // Cookies nécessaires (toujours activés)
    analytics: false, // Cookies d'analyse
    marketing: false // Cookies marketing
  });

  // Vérifier si l'utilisateur a déjà accepté ou refusé les cookies
  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    
    // Si aucun consentement n'est enregistré, afficher la bannière
    if (!cookieConsent) {
      setShowBanner(true);
    } else {
      // Sinon, charger les préférences sauvegardées
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(savedPreferences);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences cookies:', error);
        setShowBanner(true);
      }
    }
  }, []);

  // À chaque nouvelle connexion (nouveau jeton), le choix est redemandé
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && localStorage.getItem('cookieAskedToken') !== token.slice(-24)) setShowBanner(true);
  }, [location.pathname]);

  // Rouvrir le choix depuis le pied de page (« Gérer les cookies »)
  useEffect(() => {
    const reopen = () => { setShowBanner(true); setShowSettings(true); };
    window.addEventListener('open-cookie-settings', reopen);
    return () => window.removeEventListener('open-cookie-settings', reopen);
  }, []);

  // Fonction pour sauvegarder les préférences dans localStorage
  const savePreferences = (prefs) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) localStorage.setItem('cookieAskedToken', token.slice(-24));
    setAnalyticsConsent(Boolean(prefs.analytics));
    // la page courante est comptée dès l'acceptation
    if (prefs.analytics) trackPageView(window.location.pathname);
  };

  // Fonction pour accepter tous les cookies
  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true
    };
    
    setPreferences(allAccepted);
    savePreferences(allAccepted);
    setShowBanner(false);
    setShowSettings(false);
    
    // Déclencher l'événement pour activer les services tiers (Google Analytics, etc.)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_all',
      consent_analytics: true,
      consent_marketing: true
    });
  };

  // Fonction pour refuser tous les cookies non nécessaires
  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false
    };
    
    setPreferences(onlyNecessary);
    savePreferences(onlyNecessary);
    setShowBanner(false);
    setShowSettings(false);
    
    // Déclencher l'événement de refus
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_reject',
      consent_analytics: false,
      consent_marketing: false
    });
  };

  // Fonction pour sauvegarder les préférences personnalisées
  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    
    // Déclencher l'événement avec les préférences personnalisées
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'cookie_consent_custom',
      consent_analytics: preferences.analytics,
      consent_marketing: preferences.marketing
    });
  };

  // Fonction pour basculer une préférence spécifique
  const togglePreference = (key) => {
    if (key === 'necessary') return; // Les cookies nécessaires ne peuvent pas être désactivés
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Ne rien afficher si la bannière est masquée
  if (!showBanner) return null;

  return (
    <>
      {/* Overlay sombre derrière la bannière */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" />
      
      {/* Bannière principale */}
      <div className={`fixed bottom-0 left-0 right-0 z-[9999] pb-[env(safe-area-inset-bottom)] transform transition-all duration-500 ${
        showBanner ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className={`max-w-7xl mx-auto m-2 md:m-4 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-2xl shadow-2xl border-2 ${
          isDarkMode 
            ? 'bg-gray-800 border-blue-500/30' 
            : 'bg-white dark:bg-[#1E293B] border-blue-500/50'
        }`}>
          
          {/* Contenu principal de la bannière */}
          <div className="p-3 sm:p-4 md:p-8">
            <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
              {/* Icône cookie */}
              <div className={`hidden sm:flex flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100 dark:bg-[#1E40AF]/50'
              }`}>
                <MdCookie className="text-3xl text-blue-500 dark:text-[#60A5FA]" />
              </div>
              
              {/* Texte principal */}
              <div className="flex-1">
                <h3 className={`text-base md:text-xl font-bold mb-1 md:mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'
                }`}>
                  🍪 Nous respectons votre vie privée
                </h3>
                <p className={`text-xs md:text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-[#CBD5E1]'
                }`}>
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  En cliquant sur "Accepter tout", vous consentez à l'utilisation de TOUS les cookies. 
                  Vous pouvez aussi personnaliser vos préférences.
                </p>
                
                {/* Lien vers la politique de confidentialité */}
                <Link 
                  to="/privacy-policy" 
                  className="inline-flex items-start gap-1 mt-2 text-xs md:text-sm text-blue-500 dark:text-[#60A5FA] hover:text-blue-600 dark:hover:text-[#60A5FA] hover:underline"
                >
                  <MdInfo size={16} className="shrink-0 mt-0.5" />
                  En savoir plus sur notre politique de confidentialité
                </Link>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 md:gap-3">
              {/* Bouton Accepter tout */}
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 dark:bg-[#3B82F6] hover:bg-blue-700 text-white px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <MdCheck size={20} />
                Accepter tout
              </button>
              
              {/* Bouton Refuser tout */}
              <button
                onClick={handleRejectAll}
                className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 dark:bg-[#334155] border-gray-300 dark:border-[#475569] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-200 dark:hover:bg-[#475569]'
                }`}
              >
                <MdClose size={20} />
                Refuser tout
              </button>
              
              {/* Bouton Personnaliser */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`col-span-2 sm:col-span-1 flex-1 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
                  isDarkMode
                    ? 'bg-transparent border-blue-500 text-blue-400 hover:bg-blue-500/10'
                    : 'bg-transparent border-blue-500 text-blue-600 dark:text-[#60A5FA] hover:bg-blue-50 dark:hover:bg-[#1E40AF]/25'
                }`}
              >
                <MdSettings size={20} />
                Personnaliser
              </button>
            </div>
          </div>
          
          {/* Panneau de paramètres détaillés (affiché si showSettings est vrai) */}
          {showSettings && (
            <div className={`border-t-2 p-3 sm:p-6 md:p-8 space-y-3 sm:space-y-6 ${
              isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 dark:border-[#334155] bg-gray-50 dark:bg-[#334155]/50'
            }`}>
              <h4 className={`text-base md:text-lg font-bold mb-2 md:mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'
              }`}>
                <MdSecurity className="text-blue-500 dark:text-[#60A5FA]" />
                Gérer mes préférences de cookies
              </h4>
              
              {/* Cookie nécessaires (toujours activés) */}
              <div className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-[#1E293B]'
              }`}>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="mt-1 w-5 h-5 text-blue-600 dark:text-[#60A5FA] rounded cursor-not-allowed opacity-50"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'
                  }`}>
                    🔒 Cookies nécessaires <span className="text-xs text-blue-500 dark:text-[#60A5FA]">(Obligatoire)</span>
                  </h5>
                  <p className={`text-xs md:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'
                  }`}>
                    Ces cookies sont indispensables au fonctionnement du site. 
                    Ils permettent l'authentification, la sécurité et les fonctionnalités de base.
                  </p>
                </div>
              </div>
              
              {/* Cookies analytiques */}
              <div className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg cursor-pointer transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#334155]/50'
              }`}
                onClick={() => togglePreference('analytics')}
              >
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="mt-1 w-5 h-5 text-blue-600 dark:text-[#60A5FA] rounded cursor-pointer"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'
                  }`}>
                    📊 Cookies analytiques
                  </h5>
                  <p className={`text-xs md:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'
                  }`}>
                    Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site. 
                    Données anonymisées utilisées pour améliorer l'expérience utilisateur.
                  </p>
                </div>
              </div>
              
              {/* Cookies marketing */}
              <div className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg cursor-pointer transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white dark:bg-[#1E293B] hover:bg-gray-50 dark:hover:bg-[#334155]/50'
              }`}
                onClick={() => togglePreference('marketing')}
              >
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => togglePreference('marketing')}
                  className="mt-1 w-5 h-5 text-blue-600 dark:text-[#60A5FA] rounded cursor-pointer"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'
                  }`}>
                    🎯 Cookies marketing
                  </h5>
                  <p className={`text-xs md:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'
                  }`}>
                    Ces cookies permettent de vous proposer des publicités et du contenu personnalisé. 
                    Ils peuvent être déposés par nos partenaires publicitaires.
                  </p>
                </div>
              </div>
              
              {/* Boutons de validation des préférences */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 dark:bg-[#3B82F6] hover:bg-blue-700 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MdCheck size={20} />
                  Enregistrer mes préférences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 dark:bg-[#475569] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-300 dark:hover:bg-[#475569]'
                  }`}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

