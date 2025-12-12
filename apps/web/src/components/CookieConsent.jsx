import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
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

  // Fonction pour sauvegarder les préférences dans localStorage
  const savePreferences = (prefs) => {
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    console.log('✅ Préférences cookies sauvegardées:', prefs);
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
      <div className={`fixed bottom-0 left-0 right-0 z-[9999] transform transition-all duration-500 ${
        showBanner ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className={`max-w-7xl mx-auto m-4 rounded-2xl shadow-2xl border-2 ${
          isDarkMode 
            ? 'bg-gray-800 border-blue-500/30' 
            : 'bg-white border-blue-500/50'
        }`}>
          
          {/* Contenu principal de la bannière */}
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              {/* Icône cookie */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <MdCookie className="text-3xl text-blue-500" />
              </div>
              
              {/* Texte principal */}
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  🍪 Nous respectons votre vie privée
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                  En cliquant sur "Accepter tout", vous consentez à l'utilisation de TOUS les cookies. 
                  Vous pouvez aussi personnaliser vos préférences.
                </p>
                
                {/* Lien vers la politique de confidentialité */}
                <Link 
                  to="/privacy-policy" 
                  className="inline-flex items-center gap-1 mt-2 text-sm text-blue-500 hover:text-blue-600 hover:underline"
                >
                  <MdInfo size={16} />
                  En savoir plus sur notre politique de confidentialité
                </Link>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Bouton Accepter tout */}
              <button
                onClick={handleAcceptAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <MdCheck size={20} />
                Accepter tout
              </button>
              
              {/* Bouton Refuser tout */}
              <button
                onClick={handleRejectAll}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MdClose size={20} />
                Refuser tout
              </button>
              
              {/* Bouton Personnaliser */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 border-2 ${
                  isDarkMode
                    ? 'bg-transparent border-blue-500 text-blue-400 hover:bg-blue-500/10'
                    : 'bg-transparent border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <MdSettings size={20} />
                Personnaliser
              </button>
            </div>
          </div>
          
          {/* Panneau de paramètres détaillés (affiché si showSettings est vrai) */}
          {showSettings && (
            <div className={`border-t-2 p-6 md:p-8 space-y-6 ${
              isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <MdSecurity className="text-blue-500" />
                Gérer mes préférences de cookies
              </h4>
              
              {/* Cookie nécessaires (toujours activés) */}
              <div className={`flex items-start gap-4 p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <input
                  type="checkbox"
                  checked={preferences.necessary}
                  disabled
                  className="mt-1 w-5 h-5 text-blue-600 rounded cursor-not-allowed opacity-50"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🔒 Cookies nécessaires <span className="text-xs text-blue-500">(Obligatoire)</span>
                  </h5>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Ces cookies sont indispensables au fonctionnement du site. 
                    Ils permettent l'authentification, la sécurité et les fonctionnalités de base.
                  </p>
                </div>
              </div>
              
              {/* Cookies analytiques */}
              <div className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white hover:bg-gray-50'
              }`}
                onClick={() => togglePreference('analytics')}
              >
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={() => togglePreference('analytics')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    📊 Cookies analytiques
                  </h5>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site. 
                    Données anonymisées utilisées pour améliorer l'expérience utilisateur.
                  </p>
                </div>
              </div>
              
              {/* Cookies marketing */}
              <div className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-750' 
                  : 'bg-white hover:bg-gray-50'
              }`}
                onClick={() => togglePreference('marketing')}
              >
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={() => togglePreference('marketing')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1">
                  <h5 className={`font-semibold mb-1 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    🎯 Cookies marketing
                  </h5>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Ces cookies permettent de vous proposer des publicités et du contenu personnalisé. 
                    Ils peuvent être déposés par nos partenaires publicitaires.
                  </p>
                </div>
              </div>
              
              {/* Boutons de validation des préférences */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <MdCheck size={20} />
                  Enregistrer mes préférences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

