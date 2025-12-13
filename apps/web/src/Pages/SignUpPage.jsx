import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
  const [focusedField, setFocusedField] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const navigate = useNavigate();

  // Calculer la force du mot de passe
  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();
  const strengthPercentage = (passwordStrength / 5) * 100;

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
    console.log('🚀 ========== DÉBUT INSCRIPTION ==========');
    console.log('📋 Données du formulaire:', {
      firstName: firstName,
      lastName: lastName,
      email: email,
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      passwordsMatch: password === confirmPassword
    });

    setError("");
    setSuccess("");
    setLoading(true);
    
    // Validation des champs
    console.log('🔍 Étape 1: Validation des champs requis');
    if (!firstName.trim() || !lastName.trim()) {
      console.warn('⚠️ Validation échouée: Champs requis manquants', {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }
    console.log('✅ Champs requis: OK');

    console.log('🔍 Étape 2: Vérification correspondance des mots de passe');
    if (password !== confirmPassword) {
      console.warn('⚠️ Validation échouée: Mots de passe ne correspondent pas', {
        passwordLength: password.length,
        confirmPasswordLength: confirmPassword.length
      });
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    console.log('✅ Mots de passe correspondent: OK');

    // Validation du mot de passe
    console.log('🔍 Étape 3: Validation des règles du mot de passe');
    const passwordError = validatePassword(password);
    if (passwordError) {
      console.warn('⚠️ Validation échouée: Mot de passe invalide', {
        error: passwordError,
        passwordLength: password.length,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[@$!%*?&]/.test(password)
      });
      setShowPasswordRules(true);
      setError(passwordError);
      setLoading(false);
      return;
    }
    console.log('✅ Mot de passe valide: OK');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const signupUrl = `${API_URL.replace(/\/$/, "")}/auth/signup`;
      
      console.log('🌐 Étape 4: Configuration de la requête API');
      console.log('📍 URL API:', API_URL);
      console.log('📍 URL complète:', signupUrl);
      console.log('📤 Données à envoyer:', { 
        name: `${firstName} ${lastName}`.trim(), 
        email: email,
        passwordLength: password.length 
      });
      
      console.log('📡 Étape 5: Envoi de la requête HTTP');
      const requestBody = JSON.stringify({ 
        name: `${firstName} ${lastName}`.trim(), 
        email, 
        password 
      });
      console.log('📦 Body de la requête:', requestBody.replace(/password":"[^"]+/, 'password":"***'));

      const startTime = Date.now();
      const res = await fetch(signupUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: requestBody,
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('📥 Étape 6: Réponse reçue');
      console.log('⏱️ Temps de réponse:', `${duration}ms`);
      console.log('📊 Status:', res.status, res.statusText);
      console.log('📊 res.ok:', res.ok);
      console.log('📊 Status range:', res.status >= 200 && res.status < 300);
      console.log('📋 Headers:', Object.fromEntries(res.headers.entries()));
      
      let data = {};
      let responseText = '';
      try {
        responseText = await res.text();
        console.log('📄 Réponse texte brute:', responseText);
        console.log('📄 Longueur du texte:', responseText.length);
        if (responseText && responseText.trim()) {
          try {
            data = JSON.parse(responseText);
            console.log('✅ Réponse JSON parsée:', data);
          } catch (jsonError) {
            console.error('❌ Erreur de parsing JSON:', jsonError);
            console.error('📄 Texte qui a causé l\'erreur:', responseText);
            // Si ce n'est pas du JSON valide, traiter comme une erreur
            throw new Error(`Réponse invalide du serveur: ${responseText.substring(0, 100)}`);
          }
        } else {
          console.warn('⚠️ Réponse vide ou blanche');
          data = { message: 'Réponse vide du serveur' };
        }
      } catch (parseError) {
        console.error('❌ Erreur lors de la lecture de la réponse:', parseError);
        console.error('📄 Texte qui a causé l\'erreur:', responseText);
        throw parseError;
      }
      
      console.log('🔍 Vérification du status de la réponse...');
      console.log('   res.ok:', res.ok);
      console.log('   res.status:', res.status);
      console.log('   Condition !res.ok:', !res.ok);
      
      if (!res.ok) {
        console.error('❌ Étape 7: Erreur HTTP détectée');
        console.error('📊 Status code:', res.status);
        console.error('📋 Données d\'erreur:', data);
        
        // Gérer les erreurs de validation détaillées
        if (data.errors && Array.isArray(data.errors)) {
          console.error('📋 Erreurs de validation détaillées:', data.errors);
          // Traduire les messages d'erreur en français
          const translatedErrors = data.errors.map(err => {
            let message = err.message || err.msg;
            console.log('🔄 Traduction erreur:', { original: message });
            // Traductions
            if (message.includes('at least 12 characters')) {
              message = 'Le mot de passe doit contenir au moins 12 caractères';
            } else if (message.includes('uppercase letter, one lowercase letter')) {
              message = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)';
            } else if (message.includes('Email')) {
              message = message.replace('Email', 'Email');
            }
            return message;
          });
          const errorMessages = translatedErrors.join('. ');
          console.error('📝 Messages d\'erreur traduits:', errorMessages);
          throw new Error(errorMessages || data.message || "Erreur lors de l'inscription");
        }
        // Traduire le message principal si nécessaire
        let errorMessage = data.message || `Erreur ${res.status}: ${res.statusText}`;
        if (errorMessage.includes('Validation error')) {
          errorMessage = 'Erreur de validation. Veuillez vérifier vos données.';
        }
        console.error('📝 Message d\'erreur final:', errorMessage);
        throw new Error(errorMessage);
      }
      
      console.log('✅ Étape 7: Inscription réussie!');
      console.log('📋 Données reçues:', data);
      console.log('📊 Status code:', res.status);
      console.log('🎯 Entrée dans le bloc de succès');
      
      // Afficher le message de succès IMMÉDIATEMENT
      console.log('📝 Affichage du message de succès...');
      setSuccess("Inscription réussie ! Redirection vers la page de connexion...");
      console.log('✅ Message de succès défini');
      
      setLoading(false);
      console.log('✅ Loading désactivé');
      
      setError(""); // S'assurer qu'il n'y a pas d'erreur affichée
      console.log('✅ Erreur réinitialisée');
      
      // Compteur de redirection
      let countdown = 3;
      setRedirectCountdown(countdown);
      console.log('⏳ Redirection vers /login dans 3s...');
      
      const countdownInterval = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);
        console.log(`⏳ Redirection dans ${countdown}s...`);
        if (countdown <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      // Redirection après 3 secondes
      setTimeout(() => {
        console.log('🔄 Redirection en cours vers /login...');
        clearInterval(countdownInterval);
        setRedirectCountdown(null);
        try {
          navigate("/login", { replace: true });
          console.log('✅ Redirection effectuée avec succès');
        } catch (navError) {
          console.error('❌ Erreur lors de la redirection:', navError);
          // Fallback: redirection manuelle
          window.location.href = "/login";
        }
      }, 3000);
    } catch (err) {
      console.error('❌ ========== ERREUR CAPTURÉE ==========');
      console.error('❌ Type d\'erreur:', err.constructor.name);
      console.error('❌ Message:', err.message);
      console.error('❌ Stack:', err.stack);
      console.error('❌ Erreur complète:', err);
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.error('🌐 Erreur réseau détectée');
        console.error('💡 Vérifications à faire:');
        console.error('   1. Le backend est-il démarré?');
        console.error('   2. L\'URL API est-elle correcte?', import.meta.env.VITE_API_URL);
        console.error('   3. Y a-t-il un problème CORS?');
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet et que le backend est démarré.");
      } else {
        console.error('📝 Affichage de l\'erreur à l\'utilisateur:', err.message);
        setError(err.message || "Erreur lors de l'inscription");
      }
      setLoading(false);
      console.log('❌ ========== FIN ERREUR ==========');
    }
    console.log('🏁 ========== FIN INSCRIPTION ==========');
  };

  const passwordRules = [
    { label: 'Au moins 12 caractères', test: () => password.length >= 12 },
    { label: 'Une majuscule (A-Z)', test: () => /[A-Z]/.test(password) },
    { label: 'Une minuscule (a-z)', test: () => /[a-z]/.test(password) },
    { label: 'Un chiffre (0-9)', test: () => /[0-9]/.test(password) },
    { label: 'Un caractère spécial (@$!%*?&)', test: () => /[@$!%*?&]/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-between px-4 py-6 md:py-8">
      <div className="flex flex-1 items-center justify-center w-full">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          {/* Formulaire */}
          <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center relative">
            {/* Effet de fond animé */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col items-center mb-8 animate-fade-in">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <img src="/vite.svg" alt="MyBudget+ Logo" className="h-12 md:h-14 mb-2 relative z-10" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  MyBudget<span className="text-blue-400">+</span>
                </h1>
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mt-2 mb-2">Créer un compte</h2>
                <p className="text-gray-500 text-center text-sm md:text-base">
                  Lancez-vous avec MyBudget+ pour gérer vos finances intelligemment.
                </p>
              </div>

              {/* Messages d'erreur/succès avec animation */}
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
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-green-800 text-base font-bold mb-1">{success}</div>
                      {redirectCountdown !== null && redirectCountdown > 0 && (
                        <div className="text-green-600 text-sm">
                          Redirection dans <span className="font-bold text-green-700">{redirectCountdown}</span> seconde{redirectCountdown > 1 ? 's' : ''}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>
                {/* Prénom et Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Prénom
                    </label>
                    <input 
                      type="text" 
                      placeholder="John" 
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'firstName' 
                          ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nom de famille
                    </label>
                    <input 
                      type="text" 
                      placeholder="Doe" 
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 ${
                        focusedField === 'lastName' 
                          ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)}
                      onFocus={() => setFocusedField('lastName')}
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
                  <input 
                    type="email" 
                    placeholder="john.doe@exemple.com" 
                    className={`w-full rounded-xl border-2 px-4 py-3 text-sm transition-all duration-200 ${
                      focusedField === 'email' 
                        ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    required 
                  />
                </div>

                {/* Mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      Mot de passe
                    </label>
                    {password && (
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
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Votre mot de passe sécurisé" 
                      className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-sm transition-all duration-200 ${
                        focusedField === 'password' 
                          ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={password} 
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setPassword(newPassword);
                      if (newPassword.length > 0) {
                        setShowPasswordRules(true);
                        console.log('🔐 Mot de passe modifié:', {
                          length: newPassword.length,
                          strength: getPasswordStrength(),
                          isValid: isPasswordValid()
                        });
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

                  {/* Règles du mot de passe avec animation */}
                  {showPasswordRules && password && !isPasswordValid() && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl space-y-2 animate-slide-down">
                      <div className="font-semibold text-sm text-gray-700 mb-2">Règles du mot de passe :</div>
                      {passwordRules.map((rule, index) => {
                        const isValid = rule.test();
                        return (
                          <div 
                            key={index}
                            className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                              isValid ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isValid ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isValid ? (
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                            <span className={isValid ? 'line-through opacity-50' : ''}>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirmer le mot de passe */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirmez votre mot de passe" 
                      className={`w-full rounded-xl border-2 px-4 py-3 pr-12 text-sm transition-all duration-200 ${
                        focusedField === 'confirmPassword' 
                          ? 'border-blue-500 ring-4 ring-blue-100 bg-blue-50' 
                          : confirmPassword && password !== confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : confirmPassword && password === confirmPassword
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                      } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                      value={confirmPassword} 
                      onChange={e => {
                        const newConfirmPassword = e.target.value;
                        setConfirmPassword(newConfirmPassword);
                        console.log('🔐 Confirmation mot de passe modifiée:', {
                          matches: password === newConfirmPassword,
                          passwordLength: password.length,
                          confirmLength: newConfirmPassword.length
                        });
                      }}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField('')}
                      required 
                    />
                    {confirmPassword && (
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        {password === confirmPassword ? (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
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
                
                {/* Bouton d'inscription */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full rounded-xl font-semibold py-4 mt-6 transition-all duration-300 transform ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                  } text-white text-sm md:text-base flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Inscription en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>S'inscrire</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Liens */}
              <div className="mt-6 space-y-3 text-center relative z-10">
                <p className="text-xs text-gray-500">
                  En cliquant sur "S'inscrire", vous acceptez notre{' '}
                  <Link to="/privacy-policy" className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
                    Politique de confidentialité
                  </Link>
                </p>
                <p className="text-sm text-gray-700">
                  Vous avez déjà un compte ?{' '}
                  <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Section témoignage moderne */}
          <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
            {/* Effets de fond */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 text-white text-center">
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center mb-4 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <blockquote className="text-xl md:text-2xl font-medium mb-4 leading-relaxed">
                  « MyBudget+ a transformé la façon dont je gère mes finances. C'est intuitif, puissant et me fait gagner un temps précieux. »
                </blockquote>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30"></div>
                  <div className="text-left">
                    <div className="font-semibold">Alice Dubois</div>
                    <div className="text-sm text-white/80">Analyste Financière</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-xs uppercase tracking-wider text-white/60 mb-4">APPROUVÉ PAR DES EXPERTS</div>
                <div className="flex gap-4 justify-center items-center">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white/20 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer moderne */}
      <footer className="text-xs text-gray-400 text-center py-4">
        Made with <span className="text-red-500 animate-pulse">♥</span> by MyBudget+
      </footer>

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
};

export default SignUpPage;
