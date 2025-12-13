import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const navigate = useNavigate();

  // Vérifier si le mot de passe est valide
  const isPasswordValid = () => {
    return password.length >= 12 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[@$!%*?&]/.test(password);
  };

  // Validation du mot de passe
  const validatePassword = (pwd) => {
    if (pwd.length < 12) {
      return "Le mot de passe doit contenir au moins 12 caractères";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Le mot de passe doit contenir au moins une majuscule";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Le mot de passe doit contenir au moins une minuscule";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Le mot de passe doit contenir au moins un chiffre";
    }
    if (!/[@$!%*?&]/.test(pwd)) {
      return "Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&)";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    // Validation des champs
    if (!firstName.trim() || !lastName.trim()) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    // Validation du mot de passe
    const passwordError = validatePassword(password);
    if (passwordError) {
      setShowPasswordRules(true);
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const signupUrl = `${API_URL.replace(/\/$/, "")}/auth/signup`;
      console.log('📤 Envoi de la requête d\'inscription vers:', signupUrl);
      console.log('📤 Données envoyées:', { name: `${firstName} ${lastName}`.trim(), email });
      
      const res = await fetch(signupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, password }),
      });
      
      console.log('📥 Réponse reçue:', res.status, res.statusText);
      
      let data = {};
      try {
        const text = await res.text();
        console.log('📥 Réponse texte:', text);
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('❌ Erreur de parsing JSON:', parseError);
      }
      
      if (!res.ok) {
        // Gérer les erreurs de validation détaillées
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map(err => err.message || err.msg).join(', ');
          throw new Error(errorMessages || data.message || "Erreur lors de l'inscription");
        }
        throw new Error(data.message || `Erreur ${res.status}: ${res.statusText}`);
      }
      
      console.log('✅ Inscription réussie!', data);
      setSuccess("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error('❌ Erreur lors de l\'inscription:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est démarré.");
      } else {
        setError(err.message || "Erreur lors de l'inscription");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between px-4 py-6 md:py-8">
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md flex flex-col md:flex-row overflow-hidden">
          {/* Formulaire */}
          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex flex-col items-center mb-6 md:mb-8">
              <img src="/vite.svg" alt="MyBudget+ Logo" className="h-8 md:h-10 mb-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                <span className="text-blue-600">MyBudget</span><span className="text-blue-400">+</span>
              </h1>
              <h2 className="text-lg md:text-xl font-semibold mt-2 mb-1">Créer un compte</h2>
              <p className="text-gray-500 text-center text-xs md:text-sm">
                Lancez-vous avec MyBudget+ pour gérer vos finances.
              </p>
            </div>
            {error && <div className="mb-4 text-red-600 text-center text-xs md:text-sm">{error}</div>}
            {success && <div className="mb-4 text-green-600 text-center text-xs md:text-sm">{success}</div>}
            <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Prénom</label>
                  <input type="text" placeholder="John" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs md:text-sm font-medium text-gray-700">Nom de famille</label>
                  <input type="text" placeholder="Doe" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Adresse e-mail</label>
                <input type="email" placeholder="john.doe@exemple.com" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Votre mot de passe" 
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={password} 
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.length > 0) {
                        setShowPasswordRules(true);
                      }
                    }} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21M15.536 15.536L12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {showPasswordRules && password && !isPasswordValid() && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-700 mb-1">Règles du mot de passe :</div>
                    <div className={password.length >= 12 ? 'text-green-600' : 'text-red-600'}>
                      {password.length >= 12 ? '✓' : '✗'} Au moins 12 caractères
                    </div>
                    <div className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      {/[A-Z]/.test(password) ? '✓' : '✗'} Une majuscule (A-Z)
                    </div>
                    <div className={/[a-z]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      {/[a-z]/.test(password) ? '✓' : '✗'} Une minuscule (a-z)
                    </div>
                    <div className={/[0-9]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      {/[0-9]/.test(password) ? '✓' : '✗'} Un chiffre (0-9)
                    </div>
                    <div className={/[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-red-600'}>
                      {/[@$!%*?&]/.test(password) ? '✓' : '✗'} Un caractère spécial (@$!%*?&)
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirmez votre mot de passe" 
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21M15.536 15.536L12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              {/* reCAPTCHA */}              
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2.5 md:py-2 rounded-md mt-2 transition-colors text-sm md:text-base flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inscription en cours...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>
            <p className="text-[10px] md:text-xs text-gray-500 mt-3 md:mt-4 text-center">
              En cliquant sur "S'inscrire", vous reconnaissez que vous recevrez des mises à jour de MyBudget+ et que vous avez lu et accepté notre{' '}
              <a href="#" className="text-blue-600 font-medium underline">Politique de confidentialité</a>.
            </p>
            <p className="text-xs md:text-sm text-gray-700 mt-3 md:mt-4 text-center">
              Vous avez déjà un compte ?{' '}
              <a href="/login" className="text-blue-600 font-semibold hover:underline">Se connecter</a>
            </p>
          </div>
          {/* Témoignage */}
          <div className="hidden md:flex w-1/2 bg-gray-50 flex-col items-center justify-center p-6 md:p-8 lg:p-10 border-l border-gray-100">
            <div className="flex flex-col items-center">
              <img src="/public/images/people/user1.png" alt="Utilisateur" className="w-16 md:w-20 h-16 md:h-20 rounded-full object-cover mb-3 md:mb-4 border-4 border-white shadow" />
              <blockquote className="text-base md:text-lg text-center font-medium text-gray-800 mb-2">
                « MyBudget+ a transformé la façon dont je gère mes finances. C'est intuitif, puissant et me fait gagner un temps précieux. »
              </blockquote>
              <div className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Alice Dubois, Analyste Financière</div>
              <div className="text-[10px] md:text-xs text-gray-400 tracking-wide mb-2 text-center">APPROUVÉ PAR DES EXPERTS EN FINANCE</div>
              <div className="flex gap-3 md:gap-6 justify-center items-center opacity-60">
                {/* Placeholders logos experts */}
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="5" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="10" stroke="#A0AEC0" strokeWidth="2" /></svg>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 32 32"><polygon points="16,6 26,26 6,26" stroke="#A0AEC0" strokeWidth="2" fill="none" /></svg>
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 32 32"><path d="M16 6v20M6 16h20" stroke="#A0AEC0" strokeWidth="2" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="text-[10px] md:text-xs text-gray-400 text-left p-3 md:p-4 pl-4 md:pl-8">Made with <span className="text-purple-600 font-bold">♥</span> by MyBudget+</footer>
    </div>
  );
};

export default SignUpPage;
