import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      // Gestion des erreurs
      let errorMessage = 'Une erreur est survenue lors de la connexion avec Google.';
      
      if (errorParam === 'auth_failed') {
        errorMessage = 'Échec de l\'authentification Google.';
      } else if (errorParam === 'account_blocked') {
        errorMessage = 'Votre compte est bloqué. Contactez le support.';
      } else if (errorParam === 'server_error') {
        errorMessage = 'Erreur serveur. Veuillez réessayer.';
      }
      
      setError(errorMessage);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token && userParam) {
      try {
        // Sauvegarder le token et les infos utilisateur
        localStorage.setItem('token', token);
        
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('✅ Connexion Google réussie:', user.email);
        
        // Rediriger vers le dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Erreur lors du traitement du callback:', err);
        setError('Erreur lors de la connexion. Veuillez réessayer.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setError('Paramètres de connexion manquants.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        {error ? (
          <>
            <div className="text-red-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
              <p className="text-gray-600">{error}</p>
            </div>
            <p className="text-sm text-gray-500">
              Redirection vers la page de connexion...
            </p>
          </>
        ) : (
          <>
            <div className="text-blue-600 mb-4">
              <svg
                className="animate-spin w-16 h-16 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Connexion avec Google
              </h2>
              <p className="text-gray-600">
                Finalisation de votre connexion...
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

