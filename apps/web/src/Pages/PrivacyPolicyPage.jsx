import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  MdArrowBack,
  MdSecurity,
  MdCookie,
  MdShield,
  MdEmail,
  MdDescription
} from 'react-icons/md';

/**
 * Page de politique de confidentialité conforme RGPD
 * 
 * Cette page explique :
 * - Les données collectées
 * - L'utilisation des cookies
 * - Les droits des utilisateurs (accès, rectification, suppression)
 * - Les mesures de sécurité
 * - Les contacts pour exercer ses droits
 */
export default function PrivacyPolicyPage() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100 dark:bg-[#0F172A]'}`}>
      {/* En-tête */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-[#1E293B]'} shadow-lg`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-[#60A5FA] mb-4"
          >
            <MdArrowBack />
            Retour à l'accueil
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-[#1E40AF]/50 rounded-full flex items-center justify-center">
              <MdShield className="text-4xl text-blue-600 dark:text-[#60A5FA]" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
                Politique de Confidentialité
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Dernière mise à jour : 17 octobre 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-[#1E293B]'} rounded-2xl shadow-xl p-8 space-y-10`}>
          
          {/* Introduction */}
          <section>
            <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50 dark:bg-[#1E40AF]/25'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800 dark:text-[#93C5FD]'}`}>
                🔒 Chez MyBudget+, nous prenons la protection de vos données personnelles très au sérieux. 
                Cette politique explique comment nous collectons, utilisons et protégeons vos informations 
                conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </div>
          </section>

          {/* 1. Responsable du traitement */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              <MdDescription className="text-blue-600 dark:text-[#60A5FA]" />
              1. Responsable du traitement des données
            </h2>
            <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p><strong>Nom :</strong> MyBudget+</p>
              <p><strong>Email :</strong> contact@mybudget.com</p>
              <p><strong>Adresse :</strong> [À compléter]</p>
              <p className="mt-4">
                Pour toute question concernant vos données personnelles, vous pouvez nous contacter à : 
                <a href="mailto:privacy@mybudget.com" className="text-blue-600 dark:text-[#60A5FA] hover:underline ml-1">
                  privacy@mybudget.com
                </a>
              </p>
            </div>
          </section>

          {/* 2. Données collectées */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              <MdSecurity className="text-blue-600 dark:text-[#60A5FA]" />
              2. Données que nous collectons
            </h2>
            <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <div>
                <h3 className="font-semibold text-lg mb-2">📝 Données d'inscription :</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Mot de passe (hashé et sécurisé)</li>
                  <li>Date d'inscription</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">💰 Données financières :</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Transactions (montants, catégories, descriptions)</li>
                  <li>Budgets et objectifs financiers</li>
                  <li>Portefeuilles et comptes</li>
                  <li>Rappels de factures</li>
                </ul>
                <p className="mt-2 text-sm italic">
                  ⚠️ Nous ne collectons JAMAIS vos informations bancaires sensibles (numéros de carte, codes PIN, etc.)
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">🔐 Données de connexion :</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Adresse IP</li>
                  <li>Type de navigateur</li>
                  <li>Dates et heures de connexion</li>
                  <li>Pages visitées</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Utilisation des données */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              3. Comment nous utilisons vos données
            </h2>
            <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>✅ Fournir et améliorer nos services</li>
                <li>✅ Gérer votre compte utilisateur</li>
                <li>✅ Envoyer des notifications importantes (rappels de factures, alertes budgétaires)</li>
                <li>✅ Assurer la sécurité de votre compte</li>
                <li>✅ Analyser l'utilisation du site (si vous avez accepté les cookies analytiques)</li>
                <li>✅ Vous contacter pour le support client</li>
                <li>✅ Respecter nos obligations légales</li>
              </ul>
            </div>
          </section>

          {/* 4. Cookies */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              <MdCookie className="text-blue-600 dark:text-[#60A5FA]" />
              4. Utilisation des cookies
            </h2>
            <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p>Nous utilisons 3 types de cookies :</p>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-[#334155]/50'}`}>
                <h3 className="font-semibold mb-2">🔒 Cookies nécessaires (obligatoires)</h3>
                <p className="text-sm">
                  Indispensables au fonctionnement du site. Ils permettent l'authentification, 
                  la sécurité et la navigation. Vous ne pouvez pas les désactiver.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-[#334155]/50'}`}>
                <h3 className="font-semibold mb-2">📊 Cookies analytiques (optionnels)</h3>
                <p className="text-sm">
                  Nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience. 
                  Données anonymisées.
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50 dark:bg-[#334155]/50'}`}>
                <h3 className="font-semibold mb-2">🎯 Cookies marketing (optionnels)</h3>
                <p className="text-sm">
                  Permettent de vous proposer du contenu personnalisé et des publicités pertinentes.
                </p>
              </div>

              <p className="mt-4">
                Vous pouvez gérer vos préférences de cookies à tout moment via le bouton "Gérer les cookies" 
                en bas de page.
              </p>
            </div>
          </section>

          {/* 5. Vos droits RGPD */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              <MdShield className="text-blue-600 dark:text-[#60A5FA]" />
              5. Vos droits (RGPD)
            </h2>
            <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50 dark:bg-[#14532D]/30'}`}>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit de rectification :</strong> Corriger vos données inexactes
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit à l'effacement :</strong> Supprimer vos données (sous conditions)
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-[#22C55E] font-bold">✓</span>
                    <div>
                      <strong>Droit de limitation :</strong> Limiter le traitement de vos données
                    </div>
                  </li>
                </ul>
              </div>

              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à : 
                <a href="mailto:privacy@mybudget.com" className="text-blue-600 dark:text-[#60A5FA] hover:underline ml-1 font-semibold">
                  privacy@mybudget.com
                </a>
              </p>
              <p className="text-sm italic">
                Nous répondrons à votre demande dans un délai maximum de 30 jours.
              </p>
            </div>
          </section>

          {/* 6. Sécurité */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              6. Sécurité de vos données
            </h2>
            <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>🔐 Chiffrement SSL/TLS pour toutes les communications</li>
                <li>🔐 Hashage des mots de passe avec bcrypt</li>
                <li>🔐 Authentification JWT sécurisée</li>
                <li>🔐 Pare-feu et protection contre les attaques</li>
                <li>🔐 Sauvegardes régulières</li>
                <li>🔐 Accès restreint aux données (principe du moindre privilège)</li>
              </ul>
            </div>
          </section>

          {/* 7. Conservation des données */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              7. Durée de conservation
            </h2>
            <div className={`space-y-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              <p>Nous conservons vos données :</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Compte actif :</strong> Tant que votre compte est actif</li>
                <li><strong>Compte supprimé :</strong> 30 jours après suppression (période de rétention)</li>
                <li><strong>Données de connexion :</strong> 12 mois maximum</li>
                <li><strong>Cookies :</strong> 13 mois maximum</li>
              </ul>
            </div>
          </section>

          {/* 8. Contact */}
          <section>
            <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-[#F8FAFC]'}`}>
              <MdEmail className="text-blue-600 dark:text-[#60A5FA]" />
              8. Nous contacter
            </h2>
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50 dark:bg-[#1E40AF]/25'}`}>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits :
              </p>
              <div className={`space-y-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-800 dark:text-[#93C5FD]'}`}>
                <p className="flex items-center gap-2">
                  <MdEmail />
                  <a href="mailto:privacy@mybudget.com" className="hover:underline font-semibold">
                    privacy@mybudget.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <MdEmail />
                  <a href="mailto:support@mybudget.com" className="hover:underline font-semibold">
                    support@mybudget.com
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Mise à jour */}
          <section className={`border-t-2 pt-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-200 dark:border-[#334155]'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
              Cette politique de confidentialité peut être mise à jour périodiquement. 
              Nous vous informerons de tout changement important par email ou via une notification sur le site.
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
              <strong>Dernière mise à jour :</strong> 17 octobre 2025
            </p>
          </section>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white dark:bg-[#1E293B]'} mt-10 py-6`}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-[#60A5FA] font-semibold"
          >
            <MdArrowBack />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

