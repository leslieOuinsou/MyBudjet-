import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { resetPassword } from '../api';
import {
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
  MdCheckCircle,
  MdWarning,
  MdSecurity,
  MdAdminPanelSettings
} from 'react-icons/md';

export default function ResetPasswordPage() {
  const { isDarkMode } = useTheme();
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get('from'); // Lire le paramètre 'from' de l'URL
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Validation du mot de passe
  const passwordCriteria = [
    { regex: /.{12,}/, message: 'Au moins 12 caractères' },
    { regex: /[A-Z]/, message: 'Au moins 1 majuscule' },
    { regex: /[a-z]/, message: 'Au moins 1 minuscule' },
    { regex: /[0-9]/, message: 'Au moins 1 chiffre' },
    { regex: /[^A-Za-z0-9]/, message: 'Au moins 1 caractère spécial' },
  ];

  const validatePassword = (password) => {
    return passwordCriteria.map(criterion => ({
      ...criterion,
      isValid: criterion.regex.test(password)
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation côté client
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    const allCriteriaMet = passwordValidation.every(c => c.isValid);

    if (!allCriteriaMet) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Réinitialisation du mot de passe:', { token: token?.substring(0, 10) + '...', from: fromParam });
      
      const result = await resetPassword(token, formData.password);
      
      // Déterminer la redirection selon le paramètre 'from' en priorité, sinon selon le rôle
      let isAdmin = false;
      let redirectUrl = '/login';
      let dashboardType = 'utilisateur';
      
      if (fromParam === 'admin') {
        // Si la demande vient de la page admin, rediriger vers admin login
        isAdmin = true;
        redirectUrl = '/admin/login';
        dashboardType = 'admin';
      } else if (result.user?.role === 'admin') {
        // Sinon, utiliser le rôle de l'utilisateur comme fallback
        isAdmin = true;
        redirectUrl = '/admin/login';
        dashboardType = 'admin';
      }
      
      console.log(`✅ Redirection vers: ${redirectUrl} (isAdmin: ${isAdmin})`);
      
      setSuccess(`Votre mot de passe a été réinitialisé avec succès ! Redirection vers la connexion ${dashboardType}...`);
      
      setTimeout(() => {
        navigate(redirectUrl);
      }, 3000);
      
    } catch (err) {
      console.error('❌ Erreur lors de la réinitialisation:', err);
      setError(err.message || 'Erreur lors de la réinitialisation. Le lien peut être expiré ou invalide.');
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si le token est présent
  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant ou invalide.');
    }
  }, [token]);

  const isAdminReset = fromParam === 'admin'; // Vérifier si c'est une réinitialisation admin
  
  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isAdminReset 
              ? 'bg-gradient-to-r from-purple-500 to-purple-700' 
              : 'bg-gradient-to-r from-green-500 to-blue-600'
          }`}>
            {isAdminReset ? (
              <MdAdminPanelSettings className="text-white text-2xl" />
            ) : (
              <MdSecurity className="text-white text-2xl" />
            )}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Nouveau mot de passe {isAdminReset && '(Admin)'}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Créez un nouveau mot de passe sécurisé {isAdminReset && 'pour votre compte administrateur'}
          </p>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <MdWarning className="text-red-500" size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <MdCheckCircle className="text-green-500" size={20} />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nouveau mot de passe
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
            
            {/* Critères de validation du mot de passe */}
            {formData.password && (
              <div className="mt-3 space-y-1">
                {validatePassword(formData.password).map((criterion, index) => (
                  <div key={index} className={`flex items-center gap-2 text-xs ${
                    criterion.isValid ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {criterion.isValid ? <MdCheckCircle size={14} /> : <MdWarning size={14} />}
                    {criterion.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
              </button>
            </div>
            
            {/* Vérification de correspondance */}
            {formData.confirmPassword && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <MdCheckCircle className="text-green-600" size={14} />
                    <span className="text-green-600">Les mots de passe correspondent</span>
                  </>
                ) : (
                  <>
                    <MdWarning className="text-red-500" size={14} />
                    <span className="text-red-500">Les mots de passe ne correspondent pas</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 transform hover:scale-[1.02]'
            } text-white shadow-lg`}
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Réinitialisation en cours...
              </>
            ) : (
              <>
                <MdSecurity size={20} />
                Réinitialiser le mot de passe
              </>
            )}
          </button>
        </form>

        {/* Liens de navigation */}
        <div className="mt-8 text-center">
          <Link
            to={isAdminReset ? "/admin/login" : "/login"}
            className={`inline-flex items-center gap-2 hover:underline text-sm font-medium transition-colors ${
              isAdminReset ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <MdArrowBack size={16} />
            Retour à la connexion {isAdminReset && 'admin'}
          </Link>
        </div>

        {/* Informations de sécurité */}
        <div className={`mt-8 p-4 rounded-lg text-sm ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
          <div className="flex items-start gap-2">
            <MdSecurity className="text-green-500 mt-0.5" size={16} />
            <div>
              <p className="font-semibold mb-1">Conseils de sécurité :</p>
              <ul className="space-y-1 text-xs">
                <li>• Utilisez un mot de passe unique et complexe</li>
                <li>• Ne partagez jamais votre mot de passe</li>
                <li>• Changez régulièrement vos mots de passe</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
