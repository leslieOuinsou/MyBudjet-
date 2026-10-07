import React, { useState, useEffect } from 'react';
import { trackEvent } from '../lib/analytics.js';
import { Link, useNavigate } from 'react-router-dom';
import { sendSMSCode, verifySMSCode, verifyTwoFactorLogin } from '../api';
import TwoFactorPrompt from '../components/TwoFactorPrompt.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  // Double authentification : défi en cours après un mot de passe correct
  const [twoFactor, setTwoFactor] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // Connexion par SMS
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'sms'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsStep, setSmsStep] = useState('phone'); // 'phone' | 'code'
  const [smsSending, setSmsSending] = useState(false);
  const [smsVerifying, setSmsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedRemember = localStorage.getItem('savedRememberMe');

    if (savedRemember === 'true' && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Compte à rebours pour le renvoi de code
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const storeTokenAndRedirect = (data) => {
    if (rememberMe) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedEmail', email);
      localStorage.setItem('savedRememberMe', 'true');
    } else {
      sessionStorage.setItem('token', data.token);
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedEmail');
      localStorage.removeItem('savedRememberMe');
    }

    const isAdmin = data.user?.role === 'admin';
    setTimeout(() => {
      trackEvent('login', { method: 'password' });
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL.replace(/\/$/, '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Identifiants invalides' }));

        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors.map((err) => err.message).join(', '));
        }
        throw new Error(errorData.message || 'Identifiants invalides');
      }

      const data = await res.json();
      if (data.requiresTwoFactor) {
        setTwoFactor(data);
        return;
      }
      storeTokenAndRedirect(data);
    } catch (err) {
      let errorMessage = err.message || 'Erreur lors de la connexion';

      if (
        errorMessage.includes('social login') ||
        errorMessage.includes('reset your password')
      ) {
        errorMessage =
          'Ce compte a été créé avec Google. Utilisez "Se connecter avec Google" ou créez un mot de passe via "Mot de passe oublié".';
      }

      setError(errorMessage);
    }
  };

  const handleTwoFactorSubmit = async (code) => {
    setError('');
    setTwoFactorLoading(true);
    try {
      const data = await verifyTwoFactorLogin(twoFactor.challengeId, code, rememberMe);
      storeTokenAndRedirect(data);
    } catch (err) {
      setError(err.message || 'Code invalide');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const switchMethod = (method) => {
    setLoginMethod(method);
    setError('');
    setInfo('');
    setDevCode('');
  };

  const requestCode = async () => {
    const normalized = phoneNumber.replace(/\s+/g, '');
    setError('');
    setInfo('');

    if (!/^\+\d{6,15}$/.test(normalized)) {
      setError('Numéro invalide. Utilisez le format international, ex : +33612345678.');
      return;
    }

    setSmsSending(true);
    try {
      const data = await sendSMSCode(normalized);
      setSmsStep('code');
      setCooldown(60);
      // En développement (Twilio absent), l'API renvoie le code directement
      setDevCode(data?.code ? String(data.code) : '');
      setInfo(
        data?.dev
          ? 'SMS non envoyé (Twilio non configuré) — utilisez le code de test ci-dessous.'
          : `Code envoyé par SMS au ${normalized}.`
      );
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du code SMS");
    } finally {
      setSmsSending(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    await requestCode();
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (smsCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres.');
      return;
    }

    setSmsVerifying(true);
    try {
      const data = await verifySMSCode(phoneNumber.replace(/\s+/g, ''), smsCode);
      storeTokenAndRedirect(data);
    } catch (err) {
      setError(err.message || 'Erreur lors de la vérification du code');
    } finally {
      setSmsVerifying(false);
    }
  };

  const backToPhoneStep = () => {
    setSmsStep('phone');
    setSmsCode('');
    setDevCode('');
    setInfo('');
    setError('');
  };

  const inputClass =
    'w-full border-2 border-gray-200 dark:border-[#334155] rounded-xl px-4 py-3 text-sm text-[#0F172A] dark:text-[#F8FAFC] bg-white dark:bg-[#1E293B] focus:outline-none focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10 transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-[#0F172A] via-white dark:via-[#1E293B] to-gray-50 dark:to-[#0F172A] flex flex-col px-4 py-6 md:py-12">
      <div className="w-full max-w-md mx-auto shrink-0 mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-[#334155]">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] dark:to-[#2563EB] rounded-2xl shadow-lg mb-4">
              <span className="text-white font-bold text-2xl">M+</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">Connexion</h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">Connectez-vous pour accéder à votre compte</p>
          </div>

          {/* Sélecteur de méthode de connexion */}
          {!twoFactor && (
          <div className="flex bg-gray-100 dark:bg-[#334155] rounded-xl p-1 mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'email'}
              onClick={() => switchMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                loginMethod === 'email'
                  ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-[#60A5FA] shadow'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              E-mail
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'sms'}
              onClick={() => switchMethod('sms')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                loginMethod === 'sms'
                  ? 'bg-white dark:bg-[#1E293B] text-[#1E3A8A] dark:text-[#60A5FA] shadow'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              Téléphone
            </button>
          </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-[#7F1D1D]/30 border-l-4 border-[#DC2626] rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#DC2626] dark:text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-[#DC2626] dark:text-[#F87171] text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {info && !error && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-[#14532D]/30 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-green-700 dark:text-[#4ADE80] text-sm font-medium">{info}</span>
              </div>
            </div>
          )}

          {twoFactor ? (
            <TwoFactorPrompt
              emailHint={twoFactor.emailHint}
              devCode={twoFactor.devCode}
              loading={twoFactorLoading}
              onSubmit={handleTwoFactorSubmit}
              onCancel={() => { setTwoFactor(null); setError(''); }}
            />
          ) : loginMethod === 'email' ? (
            <>
              <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-2">Adresse e-mail</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold">Mot de passe</label>
                    <Link
                      to="/forgot-password?from=user"
                      className="text-xs text-[#1E3A8A] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] hover:underline font-medium"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#1E3A8A] dark:text-[#60A5FA] border-gray-300 dark:border-[#475569] rounded focus:ring-[#1E3A8A] focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-[#64748B] dark:text-[#94A3B8]">Se souvenir de moi</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1E3A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] mt-4 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Se connecter
                </button>
              </form>

              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#475569]" />
                <span className="mx-3 text-[#64748B] dark:text-[#94A3B8] text-xs">ou</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-[#475569]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                  window.location.href = `${API_URL}/auth/google`;
                }}
                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#334155]/50 hover:border-gray-300 dark:hover:border-[#475569] font-medium mb-4 text-sm transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Se connecter avec Google
              </button>
            </>
          ) : (
            <>
              {smsStep === 'phone' ? (
                <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleSendCode}>
                  <div>
                    <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="+33 6 12 34 56 78"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
                      Format international, ex : +33612345678. Un code à 6 chiffres vous sera envoyé par SMS.
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#1E3A8A] dark:text-[#60A5FA] border-gray-300 dark:border-[#475569] rounded focus:ring-[#1E3A8A] focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-[#64748B] dark:text-[#94A3B8]">Se souvenir de moi</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={smsSending}
                    className="w-full bg-[#1E3A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] mt-4 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {smsSending ? 'Envoi en cours…' : 'Recevoir un code par SMS'}
                  </button>
                </form>
              ) : (
                <form className="flex flex-col gap-3 md:gap-4" onSubmit={handleVerifyCode}>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[#0F172A] dark:text-[#F8FAFC] text-sm font-semibold">Code de vérification</label>
                      <button
                        type="button"
                        onClick={backToPhoneStep}
                        className="text-xs text-[#1E3A8A] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] hover:underline font-medium"
                      >
                        Modifier le numéro
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
                      placeholder="••••••"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2">
                      Saisissez le code à 6 chiffres envoyé au {phoneNumber.replace(/\s+/g, '')}.
                    </p>
                  </div>

                  {devCode && (
                    <div className="p-4 bg-blue-50 dark:bg-[#1E40AF]/25 border-l-4 border-[#1E3A8A] rounded-lg">
                      <p className="text-[#1E3A8A] dark:text-[#60A5FA] text-sm font-medium">
                        Mode développement — code : <span className="font-bold tracking-widest">{devCode}</span>
                      </p>
                      <p className="text-[#64748B] dark:text-[#94A3B8] text-xs mt-1">
                        Twilio n&apos;est pas configuré ou l&apos;envoi a échoué ; utilisez ce code pour tester.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={smsVerifying || smsCode.length !== 6}
                    className="w-full bg-[#1E3A8A] text-white font-semibold py-3 rounded-xl hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] mt-4 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {smsVerifying ? 'Vérification…' : 'Se connecter'}
                  </button>

                  <button
                    type="button"
                    onClick={requestCode}
                    disabled={cooldown > 0 || smsSending}
                    className="w-full text-[#1E3A8A] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] text-sm font-medium py-2 disabled:text-[#64748B] dark:disabled:text-[#94A3B8] disabled:cursor-not-allowed"
                  >
                    {cooldown > 0
                      ? `Renvoyer un code (${cooldown} s)`
                      : smsSending
                        ? 'Envoi en cours…'
                        : 'Renvoyer un code'}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="text-center text-[#64748B] dark:text-[#94A3B8] text-sm mt-6">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-[#1E3A8A] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] hover:underline font-semibold">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
