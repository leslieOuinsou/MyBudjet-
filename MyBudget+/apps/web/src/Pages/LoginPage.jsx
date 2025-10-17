import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('📤 Tentative de connexion avec:', { email, password: '***' });
      
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Identifiants invalides' }));
        console.error('❌ Erreur de connexion:', errorData);
        
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors.map(e => e.message).join(', '));
        }
        throw new Error(errorData.message || 'Identifiants invalides');
      }
      
      const data = await res.json();
      console.log('✅ Connexion réussie');
      localStorage.setItem('token', data.token);
      navigate('/budgets');
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8 border border-[#F5F7FA]">
          <h1 className="text-2xl font-bold text-[#343A40] text-center mb-2">Connexion</h1>
          <p className="text-center text-[#6C757D] text-sm mb-6">Connectez-vous pour accéder à votre compte.</p>
          {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="block text-[#343A40] text-sm mb-1">Adresse e-mail</label>
              <input
                type="email"
                className="w-full border border-[#F5F7FA] rounded px-3 py-2 text-[#343A40] bg-[#F5F7FA] focus:outline-none focus:border-[#1E73BE]"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[#343A40] text-sm">Mot de passe</label>
                <Link to="/forgot-password" className="text-xs text-[#1E73BE] hover:underline">Mot de passe oublié ?</Link>
              </div>
              <input
                type="password"
                className="w-full border border-[#F5F7FA] rounded px-3 py-2 text-[#343A40] bg-[#F5F7FA] focus:outline-none focus:border-[#1E73BE]"
                placeholder="Votre mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1E73BE] text-white font-semibold py-2 rounded hover:bg-[#155a8a] mt-2"
            >
              Se connecter
            </button>
          </form>
          {/* Google OAuth réactivé */}
          {true && (
            <>
              <div className="flex items-center my-6">
                <div className="flex-1 h-px bg-[#F5F7FA]"></div>
                <span className="mx-3 text-[#6C757D] text-sm">ou</span>
                <div className="flex-1 h-px bg-[#F5F7FA]"></div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                  window.location.href = `${API_URL}/auth/google`;
                }}
                className="w-full flex items-center justify-center gap-2 border border-[#F5F7FA] bg-white text-[#343A40] py-2 rounded hover:bg-[#F5F7FA] font-medium mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Se connecter avec Google
              </button>
            </>
          )}
          <div className="text-center text-[#6C757D] text-sm">
            Pas encore de compte ? <Link to="/signup" className="text-[#1E73BE] hover:underline">S'inscrire</Link>
          </div>
          
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <Link 
              to="/admin/login" 
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 hover:underline font-medium"
            >
              <span>🔐</span>
              Accès Administrateur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
