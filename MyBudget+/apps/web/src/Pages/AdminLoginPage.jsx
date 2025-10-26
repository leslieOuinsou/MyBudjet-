import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
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
  const { isDarkMode } = useTheme();
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
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a1a] via-purple-900/10 to-[#1a1a1a]' : 'bg-gradient-to-br from-purple-50 via-white to-purple-100'}`}>
      {/* Partie gauche - Branding Admin */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Motifs de fond */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white hover:opacity-80 transition mb-8">
            <MdArrowBack size={24} />
            <span className="text-sm">Retour à l'accueil</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <MdAdminPanelSettings size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">MyBudget+</h1>
              <p className="text-purple-200 text-sm">Portail Administrateur</p>
            </div>
          </div>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg mt-1">
                <MdAdminPanelSettings size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Accès Sécurisé</h3>
                <p className="text-purple-200">
                  Portail réservé aux administrateurs de la plateforme MyBudget+. 
                  Authentification renforcée et sessions sécurisées.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg mt-1">
                <MdLock size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Sécurité Maximale</h3>
                <p className="text-purple-200">
                  Toutes les actions administratives sont surveillées et enregistrées 
                  pour garantir la sécurité de la plateforme.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-purple-200 text-sm">
          © 2025 MyBudget+. Tous droits réservés.
          <div className="mt-2 text-xs">
            Version Admin 1.0 • Sécurisé par SSL
          </div>
        </div>
      </div>
      
      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl">
                <MdAdminPanelSettings size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  MyBudget+
                </h1>
                <p className="text-purple-600 text-sm">Portail Admin</p>
              </div>
            </div>
          </div>
          
          <div className={`p-8 rounded-2xl shadow-xl ${isDarkMode ? 'bg-[#2d2d2d] border border-purple-700/30' : 'bg-white border border-purple-100'}`}>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg">
                  <MdAdminPanelSettings size={24} className="text-white" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Connexion Admin
                </h2>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Accédez au panneau d'administration
              </p>
            </div>
            
            {error && (
              <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Administrateur
                </label>
                <div className="relative">
                  <MdEmail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border transition ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white focus:border-purple-500' : 'bg-white border-purple-200 text-black focus:border-purple-500'}`}
                    placeholder="admin@mybudget.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mot de passe
                </label>
                <div className="relative">
                  <MdLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border transition ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white focus:border-purple-500' : 'bg-white border-purple-200 text-black focus:border-purple-500'}`}
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>
              
              {/* Option "Se souvenir de moi" */}
              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Se souvenir de moi
                  </span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Connexion...
                  </>
                ) : (
                  <>
                    <MdAdminPanelSettings size={20} />
                    Se connecter en tant qu'Admin
                  </>
                )}
              </button>
            </form>
            
            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-purple-700/30' : 'border-purple-100'}`}>
              <div className="text-center space-y-3">
                <Link
                  to="/forgot-password?from=admin"
                  className="block text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pas encore de compte admin ?{' '}
                  <Link
                    to="/admin/signup"
                    className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                  >
                    Créer un compte
                  </Link>
                </div>
                <Link
                  to="/login"
                  className="block text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Connexion utilisateur standard →
                </Link>
              </div>
            </div>
            
            {/* Avertissement de sécurité */}
            <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-700/50' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-start gap-3">
                <MdLock size={20} className="text-purple-600 mt-0.5" />
                <div className={`text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
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
    </div>
  );
}

