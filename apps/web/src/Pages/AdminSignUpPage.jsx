import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  
  // Validation du mot de passe
  const passwordRequirements = {
    length: formData.password.length >= 12,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[@$!%*?&]/.test(formData.password)
  };
  
  const allRequirementsMet = Object.values(passwordRequirements).every(v => v);

  // Calculer la force du mot de passe
  const getPasswordStrength = () => {
    let strength = 0;
    if (formData.password.length >= 12) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/[a-z]/.test(formData.password)) strength++;
    if (/[0-9]/.test(formData.password)) strength++;
    if (/[@$!%*?&]/.test(formData.password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthPercentage = (passwordStrength / 5) * 100;

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
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL.replace(/\/$/, "")}/auth/signup-admin`, {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col px-4 py-6 md:py-8">
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-gray-200">
          {/* Formulaire */}
          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center relative">
            {/* Effet de fond animé */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/5 to-transparent opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
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

              <div className="flex flex-col items-center mb-8 animate-fade-in">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-[#1E3A8A] rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#155a8a] rounded-2xl flex items-center justify-center shadow-lg">
                    <MdAdminPanelSettings className="text-white text-2xl" />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#343A40] mb-2">
                  MyBudget<span className="text-[#1E3A8A]">+</span>
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-[#343A40] mt-2 mb-2">Créer un compte Admin</h2>
                <p className="text-[#6C757D] text-center text-sm md:text-base">
                  Portail réservé aux administrateurs autorisés
                </p>
              </div>

              {/* Messages d'erreur/succès */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm animate-slide-down">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-red-800 text-sm font-medium">{error}</div>
                  </div>
                </div>
              )}
              {success && (
                <div className="mb-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-lg animate-slide-down">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                        <MdCheckCircle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-green-800 text-base font-bold mb-1">{success}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Avertissement */}
              <div className="mb-6 p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-start gap-3">
                  <MdWarning size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-700">
                    <div className="font-semibold mb-1">Code d'activation requis</div>
                    <div>
                      Un code d'activation admin est nécessaire pour créer ce compte. 
                      Contactez le super-administrateur si vous n'en avez pas.
                    </div>
                  </div>
                </div>
              </div>

              <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                {/* Nom complet */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nom complet
                  </label>
                  <div className="relative">
                    <MdPerson className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${focusedField === 'name' ? 'text-[#1E3A8A]' : 'text-gray-400'}`} size={20} />
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className={`w-full pl-10 pr-4 rounded-xl border-2 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'name' 
                          ? 'border-[#1E3A8A] ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A]'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <MdEmail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${focusedField === 'email' ? 'text-[#1E3A8A]' : 'text-gray-400'}`} size={20} />
                    <input 
                      type="email" 
                      placeholder="admin@mybudget.com" 
                      className={`w-full pl-10 pr-4 rounded-xl border-2 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'email' 
                          ? 'border-[#1E3A8A] ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A]'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Mot de passe
                    </label>
                    {formData.password && (
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">Force:</div>
                        <div className="flex-1 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              strengthPercentage < 40 ? 'bg-red-500' :
                              strengthPercentage < 80 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${strengthPercentage}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          strengthPercentage < 40 ? 'text-red-500' :
                          strengthPercentage < 80 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {strengthPercentage < 40 ? 'Faible' : strengthPercentage < 80 ? 'Moyen' : 'Fort'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <MdLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${focusedField === 'password' ? 'text-[#1E3A8A]' : 'text-gray-400'}`} size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Votre mot de passe sécurisé" 
                      className={`w-full pl-10 pr-12 rounded-xl border-2 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'password' 
                          ? 'border-[#1E3A8A] ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A]'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={formData.password} 
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setFormData({...formData, password: newPassword});
                        if (newPassword.length > 0) {
                          setShowPasswordRules(true);
                        } else {
                          setShowPasswordRules(false);
                        }
                      }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                    >
                      {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>

                  {/* Règles du mot de passe */}
                  {showPasswordRules && formData.password && !allRequirementsMet && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl space-y-2 animate-slide-down">
                      <div className="font-semibold text-sm text-gray-700 mb-2">Règles du mot de passe :</div>
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${passwordRequirements.length ? 'text-green-600' : 'text-red-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${passwordRequirements.length ? 'bg-green-100' : 'bg-red-100'}`}>
                          {passwordRequirements.length ? <MdCheckCircle className="w-3 h-3 text-green-600" /> : <span className="text-red-600">✕</span>}
                        </div>
                        <span>Au moins 12 caractères</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${passwordRequirements.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${passwordRequirements.uppercase ? 'bg-green-100' : 'bg-red-100'}`}>
                          {passwordRequirements.uppercase ? <MdCheckCircle className="w-3 h-3 text-green-600" /> : <span className="text-red-600">✕</span>}
                        </div>
                        <span>Une majuscule</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${passwordRequirements.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${passwordRequirements.lowercase ? 'bg-green-100' : 'bg-red-100'}`}>
                          {passwordRequirements.lowercase ? <MdCheckCircle className="w-3 h-3 text-green-600" /> : <span className="text-red-600">✕</span>}
                        </div>
                        <span>Une minuscule</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${passwordRequirements.number ? 'text-green-600' : 'text-red-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${passwordRequirements.number ? 'bg-green-100' : 'bg-red-100'}`}>
                          {passwordRequirements.number ? <MdCheckCircle className="w-3 h-3 text-green-600" /> : <span className="text-red-600">✕</span>}
                        </div>
                        <span>Un chiffre</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${passwordRequirements.special ? 'text-green-600' : 'text-red-500'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${passwordRequirements.special ? 'bg-green-100' : 'bg-red-100'}`}>
                          {passwordRequirements.special ? <MdCheckCircle className="w-3 h-3 text-green-600" /> : <span className="text-red-600">✕</span>}
                        </div>
                        <span>Un caractère spécial (@$!%*?&)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <MdLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${focusedField === 'confirmPassword' ? 'text-[#1E3A8A]' : 'text-gray-400'}`} size={20} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirmez votre mot de passe" 
                      className={`w-full pl-10 pr-12 rounded-xl border-2 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'confirmPassword' 
                          ? 'border-[#1E3A8A] ring-4 ring-blue-100 bg-blue-50' 
                          : formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A]'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={formData.confirmPassword} 
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                    {formData.confirmPassword && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        {formData.password === formData.confirmPassword ? (
                          <MdCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <span className="text-red-500">✕</span>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                    >
                      {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                {/* Code d'activation admin */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Code d'activation admin
                  </label>
                  <input
                    type="text"
                    value={formData.adminCode}
                    onChange={(e) => setFormData({...formData, adminCode: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 font-mono text-sm transition-all duration-200 ${
                      focusedField === 'adminCode' 
                        ? 'border-[#1E3A8A] ring-4 ring-blue-100 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-[#1E3A8A]'
                    } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    onFocus={() => setFocusedField('adminCode')}
                    onBlur={() => setFocusedField('')}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Code fourni par le super-administrateur
                  </p>
                </div>
                
                {/* Bouton d'inscription */}
                <button 
                  type="submit" 
                  disabled={loading || !allRequirementsMet}
                  className={`w-full rounded-xl font-semibold py-4 mt-6 transition-all duration-300 transform ${
                    loading || !allRequirementsMet
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#1E3A8A] to-[#155a8a] hover:from-[#155a8a] hover:to-[#1E3A8A] hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                  } text-white text-sm md:text-base flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <MdAdminPanelSettings size={20} />
                      <span>Créer le compte Admin</span>
                    </>
                  )}
                </button>
              </form>

              {/* Liens */}
              <div className="mt-6 space-y-3 text-center relative z-10">
                <p className="text-sm text-gray-700">
                  Vous avez déjà un compte admin ?{' '}
                  <Link to="/admin/login" className="text-[#1E3A8A] font-semibold hover:text-[#155a8a] hover:underline transition-colors">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Section témoignage moderne */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#1E3A8A] to-[#155a8a] flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
            {/* Effets de fond */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1E3A8A]/30 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 text-white text-center">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center mb-4 shadow-xl">
                  <MdAdminPanelSettings className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Privilèges Administrateur</h3>
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-3">
                    <MdCheckCircle size={24} className="text-white flex-shrink-0" />
                    <span>Gestion complète des utilisateurs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MdCheckCircle size={24} className="text-white flex-shrink-0" />
                    <span>Accès aux statistiques globales</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MdCheckCircle size={24} className="text-white flex-shrink-0" />
                    <span>Support technique prioritaire</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MdCheckCircle size={24} className="text-white flex-shrink-0" />
                    <span>Sécurité et surveillance avancées</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
