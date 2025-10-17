# 🎨 Exemple d'intégration du bouton Google

## Composant créé

Un composant `GoogleLoginButton` a été créé dans :
```
apps/web/src/components/GoogleLoginButton.jsx
```

## Comment l'utiliser

### Étape 1 : Importer le composant

Dans votre page de connexion (`LoginPage.jsx`) ou inscription (`SignUpPage.jsx`) :

```jsx
import GoogleLoginButton from '../components/GoogleLoginButton';
```

### Étape 2 : Utiliser le composant

Ajoutez le bouton Google avec un séparateur :

```jsx
export default function LoginPage() {
  // ... votre code existant ...

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">Connexion</h2>
        
        {/* Formulaire de connexion classique */}
        <form onSubmit={handleSubmit}>
          {/* ... vos champs email et password ... */}
          
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Se connecter
          </button>
        </form>

        {/* NOUVEAU : Séparateur "OU" */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou</span>
          </div>
        </div>

        {/* NOUVEAU : Bouton Google */}
        <GoogleLoginButton text="Se connecter avec Google" />

        {/* Lien vers inscription */}
        <p className="text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}
```

### Étape 3 : Même chose pour la page d'inscription

Dans `SignUpPage.jsx` :

```jsx
import GoogleLoginButton from '../components/GoogleLoginButton';

// Dans le JSX, après le formulaire d'inscription :
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-300"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">Ou</span>
  </div>
</div>

<GoogleLoginButton text="S'inscrire avec Google" />
```

## Personnalisation

### Changer le texte du bouton

```jsx
<GoogleLoginButton text="Connexion rapide avec Google" />
```

### Styles personnalisés

Vous pouvez modifier le fichier `GoogleLoginButton.jsx` pour changer :
- Les couleurs
- La taille
- Les espacements
- Les animations

## Exemple complet : LoginPage.jsx

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      // Sauvegarder le token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à MyBudget+
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Gérez vos finances en toute simplicité
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Se connecter
              </button>
            </div>
          </form>

          {/* Séparateur */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
              </div>
            </div>

            {/* Bouton Google */}
            <div className="mt-6">
              <GoogleLoginButton text="Se connecter avec Google" />
            </div>
          </div>

          {/* Lien inscription */}
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Créer un compte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Gestion du callback OAuth

Le backend gère automatiquement le callback. Vous devez juste gérer le retour :

```jsx
// Dans App.jsx ou un composant dédié
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
      navigate('/dashboard');
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connexion avec Google...</p>
      </div>
    </div>
  );
}
```

## Route à ajouter

Dans votre `App.jsx` :

```jsx
<Route path="/auth/google/callback" element={<GoogleCallback />} />
```

---

Voilà ! Le bouton Google est maintenant intégré. ✨

