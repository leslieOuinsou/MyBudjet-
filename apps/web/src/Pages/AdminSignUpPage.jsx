import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  MdAdminPanelSettings, 
  MdEmail, 
  MdLock,
  MdPerson,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
  MdCheckCircle,
  MdWarning
} from 'react-icons/md';

export default function AdminSignUpPage() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Validation du mot de passe
  const passwordRequirements = {
    length: formData.password.length >= 12,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  };
  
  const allRequirementsMet = Object.values(passwordRequirements).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (!allRequirementsMet) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité');
      return;
    }
    
    // Vérification du code admin (sécurité supplémentaire)
    if (!formData.adminCode) {
      setError('Le code d\'activation admin est requis');
      return;
    }
    
    setLoading(true);

    try {
      console.log('🔐 Création compte admin:', { email: formData.email, name: formData.name });
      
      const response = await fetch('http://localhost:3001/api/auth/signup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          adminCode: formData.adminCode,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte');
      }
      
      const data = await response.json();
      console.log('✅ Compte admin créé:', data);
      
      setSuccess('✅ Compte administrateur créé avec succès ! Redirection...');
      
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Erreur création admin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gradient-to-br from-[#1a1a1a] via-purple-900/10 to-[#1a1a1a]' : 'bg-gradient-to-br from-purple-50 via-white to-purple-100'}`}>
      {/* Partie gauche */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-900 p-12 flex-col justify-between relative overflow-hidden">
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
              <p className="text-purple-200 text-sm">Création Compte Admin</p>
            </div>
          </div>
          
          <div className="mt-12 space-y-4 text-purple-200">
            <div className="flex items-center gap-2">
              <MdCheckCircle size={20} className="text-purple-300" />
              <span>Privilèges administrateur complets</span>
            </div>
            <div className="flex items-center gap-2">
              <MdCheckCircle size={20} className="text-purple-300" />
              <span>Gestion des utilisateurs et données</span>
            </div>
            <div className="flex items-center gap-2">
              <MdCheckCircle size={20} className="text-purple-300" />
              <span>Accès aux statistiques globales</span>
            </div>
            <div className="flex items-center gap-2">
              <MdCheckCircle size={20} className="text-purple-300" />
              <span>Support technique prioritaire</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-purple-200 text-sm">
          © 2025 MyBudget+. Tous droits réservés.
        </div>
      </div>
      
      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className={`p-8 rounded-2xl shadow-xl ${isDarkMode ? 'bg-[#2d2d2d] border border-purple-700/30' : 'bg-white border border-purple-100'}`}>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Créer un Compte Admin
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Réservé aux administrateurs autorisés
            </p>
            
            {/* Messages */}
            {error && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}
            {success && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {success}
              </div>
            )}
            
            {/* Avertissement */}
            <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/20 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-start gap-3">
                <MdWarning size={20} className="text-orange-600 mt-0.5" />
                <div className={`text-xs ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                  <div className="font-semibold mb-1">Code d'activation requis</div>
                  <div>
                    Un code d'activation admin est nécessaire pour créer ce compte. 
                    Contactez le super-administrateur si vous n'en avez pas.
                  </div>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nom complet *
                </label>
                <div className="relative">
                  <MdPerson className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white' : 'bg-white border-purple-200 text-black'}`}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email *
                </label>
                <div className="relative">
                  <MdEmail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white' : 'bg-white border-purple-200 text-black'}`}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Mot de passe *
                </label>
                <div className="relative">
                  <MdLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white' : 'bg-white border-purple-200 text-black'}`}
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
                
                {/* Exigences du mot de passe */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center gap-2 ${passwordRequirements.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <MdCheckCircle size={14} />
                      Au moins 12 caractères
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <MdCheckCircle size={14} />
                      Une majuscule
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <MdCheckCircle size={14} />
                      Une minuscule
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${passwordRequirements.number ? 'text-green-600' : 'text-gray-500'}`}>
                      <MdCheckCircle size={14} />
                      Un chiffre
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${passwordRequirements.special ? 'text-green-600' : 'text-gray-500'}`}>
                      <MdCheckCircle size={14} />
                      Un caractère spécial (!@#$%^&*)
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <MdLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white' : 'bg-white border-purple-200 text-black'}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600"
                  >
                    {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Code d'activation admin *
                </label>
                <input
                  type="text"
                  value={formData.adminCode}
                  onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg border font-mono ${isDarkMode ? 'bg-[#383838] border-purple-700/30 text-white' : 'bg-white border-purple-200 text-black'}`}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Code fourni par le super-administrateur
                </p>
              </div>
              
              {/* reCAPTCHA */}              
              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <MdAdminPanelSettings size={20} />
                    Créer le compte Admin
                  </>
                )}
              </button>
            </form>
            
            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-purple-700/30' : 'border-purple-100'}`}>
              <div className="text-center space-y-2">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vous avez déjà un compte admin ?
                </div>
                <Link
                  to="/admin/login"
                  className="block text-purple-600 hover:text-purple-700 hover:underline font-medium"
                >
                  Se connecter →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

