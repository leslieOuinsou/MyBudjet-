import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { 
  MdAdminPanelSettings, 
  MdEmail, 
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack
} from 'react-icons/md';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Charger l'email admin sauvegardé au démarrage
  useEffect(() => {
    const savedAdminEmail = localStorage.getItem('savedAdminEmail');
    const savedAdminRemember = localStorage.getItem('savedAdminRememberMe');
    
    if (savedAdminRemember === 'true' && savedAdminEmail) {
      setEmail(savedAdminEmail);
      setRememberMe(true);
      console.log('✅ Email admin chargé depuis le stockage:', savedAdminEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    setLoading(true);

    try {
      console.log('🔐 Tentative de connexion admin:', { email });
      const response = await login(email, password, rememberMe);
      
      // Vérifier que l'utilisateur est bien admin
      if (response.user.role !== 'admin') {
        setError('⚠️ Accès refusé : Ce portail est réservé aux administrateurs uniquement.');
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }
      
      console.log('✅ Connexion admin réussie');
      
      // Sauvegarder l'email admin si "Se souvenir de moi" est coché
      if (rememberMe) {
        localStorage.setItem('savedAdminEmail', email);
        localStorage.setItem('savedAdminRememberMe', 'true');
        console.log('💾 Email admin sauvegardé:', email);
      } else {
        localStorage.removeItem('savedAdminEmail');
        localStorage.removeItem('savedAdminRememberMe');
        console.log('🗑️ Email admin effacé');
      }
      
      navigate('/admin');
    } catch (err) {
      console.error('❌ Erreur connexion admin:', err);
      let errorMessage = err.message || 'Identifiants incorrects';
      
      // Message personnalisé pour les comptes Google
      if (errorMessage.includes('social login') || errorMessage.includes('reset your password')) {
        errorMessage = 'Ce compte a été créé avec Google. Créez d\'abord un mot de passe via "Mot de passe oublié" sur la page de connexion utilisateur.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col px-4 py-6 md:py-12">
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
          {/* Logo et titre */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-[#1E3A8A] rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#155a8a] rounded-2xl flex items-center justify-center shadow-lg">
                <MdAdminPanelSettings className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#343A40] mb-2">
              MyBudget<span className="text-[#1E3A8A]">+</span>
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-[#343A40] mt-2 mb-2">Connexion Admin</h2>
            <p className="text-[#6C757D] text-center text-sm md:text-base">
              Accédez au panneau d'administration
            </p>
          </div>

          {/* Bouton retour */}
          <div className="mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-[#6C757D] hover:text-[#1E3A8A] transition-colors"
            >
              <MdArrowBack size={18} />
              <span>Retour à l'accueil</span>
            </Link>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Administrateur</label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-all duration-200 border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="admin@mybudget.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <MdLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border-2 text-sm transition-all duration-200 border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A] focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
            </div>
            
            {/* Option "Se souvenir de moi" */}
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-[#1E3A8A] focus:ring-[#1E3A8A] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-[#1E3A8A] to-[#155a8a] hover:from-[#155a8a] hover:to-[#1E3A8A] text-white hover:shadow-xl transform hover:scale-[1.01]'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connexion...</span>
                </>
              ) : (
                <>
                  <MdAdminPanelSettings size={20} />
                  <span>Se connecter en tant qu'Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-3">
              <Link
                to="/forgot-password?from=admin"
                className="block text-sm text-[#1E3A8A] hover:text-[#155a8a] hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </Link>
              <div className="text-sm text-gray-600">
                Pas encore de compte admin ?{' '}
                <Link
                  to="/admin/signup"
                  className="text-[#1E3A8A] hover:text-[#155a8a] hover:underline font-semibold transition-colors"
                >
                  Créer un compte
                </Link>
              </div>
              <Link
                to="/login"
                className="block text-sm text-[#1E3A8A] hover:text-[#155a8a] hover:underline transition-colors"
              >
                Connexion utilisateur standard →
              </Link>
            </div>
          </div>

          {/* Avertissement de sécurité */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <MdLock size={20} className="text-[#1E3A8A] mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <div className="font-semibold mb-1">Accès Sécurisé</div>
                <div>
                  Cette interface est réservée aux administrateurs autorisés. 
                  Toutes les connexions sont surveillées et enregistrées.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
