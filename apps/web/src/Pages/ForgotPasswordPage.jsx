import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { forgotPassword } from '../api';
import {
  MdEmail,
  MdLock,
  MdArrowBack,
  MdCheckCircle,
  MdWarning,
  MdSecurity,
  MdAdminPanelSettings
} from 'react-icons/md';

export default function ForgotPasswordPage() {
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('from') === 'admin'; // Détecte si la demande vient de l'admin
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('🔐 Demande de réinitialisation:', { email, from: isAdmin ? 'admin' : 'user' });
      
      // Passer le paramètre 'from' pour indiquer l'origine de la demande
      await forgotPassword(email, isAdmin ? 'admin' : 'user');
      
      const accountType = isAdmin ? 'administrateur' : 'utilisateur';
      setSuccess(`Un email de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception et vos spams. Vous serez redirigé vers la page de connexion ${accountType} après la réinitialisation.`);
      
    } catch (err) {
      console.error('❌ Erreur lors de la demande de réinitialisation:', err);
      setError(err.message || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100 dark:bg-[#0F172A]'}`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl ${isDarkMode ? 'bg-[#0F172A]' : 'bg-white dark:bg-[#1E293B]'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isAdmin 
              ? 'bg-gradient-to-r from-purple-500 to-purple-700' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }`}>
            {isAdmin ? (
              <MdAdminPanelSettings className="text-white text-2xl" />
            ) : (
              <MdSecurity className="text-white text-2xl" />
            )}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800 dark:text-[#F8FAFC]'}`}>
            Mot de passe oublié {isAdmin && '(Admin)'}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
            Entrez votre adresse email {isAdmin && 'administrateur'} pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-400 text-red-700 dark:text-[#FCA5A5] px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <MdWarning className="text-red-500 dark:text-[#F87171]" size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-[#14532D]/50 border border-green-400 text-green-700 dark:text-[#4ADE80] px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <MdCheckCircle className="text-green-500" size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
              Adresse email
            </label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 dark:bg-[#334155]/50 border-gray-300 dark:border-[#475569] text-gray-900 dark:text-[#F8FAFC] placeholder-gray-500'
                }`}
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-400 dark:bg-[#475569] cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 dark:hover:from-[#3B82F6] hover:to-purple-700 transform hover:scale-[1.02]'
            } text-white shadow-lg`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <MdEmail size={20} />
                Envoyer le lien de réinitialisation
              </>
            )}
          </button>
        </form>

        {/* Liens de navigation */}
        <div className="mt-8 space-y-4">
          <div className="text-center">
            <Link
              to={isAdmin ? "/admin/login" : "/login"}
              className={`inline-flex items-center gap-2 hover:underline text-sm font-medium transition-colors ${
                isAdmin ? 'text-purple-600 dark:text-[#A78BFA] hover:text-purple-700 dark:hover:text-[#A78BFA]' : 'text-blue-600 dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-[#60A5FA]'
              }`}
            >
              <MdArrowBack size={16} />
              Retour à la connexion {isAdmin && 'admin'}
            </Link>
          </div>

          <div className="text-center">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
              Pas encore de compte {isAdmin && 'admin'} ?{' '}
              <Link
                to={isAdmin ? "/admin/signup" : "/signup"}
                className={`hover:underline font-medium transition-colors ${
                  isAdmin ? 'text-purple-600 dark:text-[#A78BFA] hover:text-purple-700 dark:hover:text-[#A78BFA]' : 'text-blue-600 dark:text-[#60A5FA] hover:text-blue-700 dark:hover:text-[#60A5FA]'
                }`}
              >
                Créer un compte
              </Link>
            </span>
          </div>
        </div>

        {/* Informations de sécurité */}
        <div className={`mt-8 p-4 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1]'}`}>
          <div className="flex items-start gap-2">
            <MdSecurity className="text-blue-500 dark:text-[#60A5FA] mt-0.5" size={16} />
            <div>
              <p className="font-semibold mb-1">Informations importantes :</p>
              <ul className="space-y-1 text-xs">
                <li>• Le lien de réinitialisation est valide 1 heure</li>
                <li>• Vérifiez votre dossier spam si vous ne recevez pas l'email</li>
                <li>• Contactez le support si le problème persiste</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}