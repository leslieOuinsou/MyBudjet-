# 🔑 Guide : Authentification avec Google OAuth

## 📋 Prérequis
- Un compte Google
- Votre application MyBudget+ configurée et fonctionnelle

---

## 🚀 Étape 1 : Créer un projet Google Cloud

### 1.1 Accéder à Google Cloud Console
1. Allez sur https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google

### 1.2 Créer un nouveau projet
1. Cliquez sur le sélecteur de projet en haut (à côté de "Google Cloud")
2. Cliquez sur **"NOUVEAU PROJET"**
3. Remplissez :
   - **Nom du projet** : `MyBudget Plus` (ou votre choix)
   - **Organisation** : Laissez par défaut
4. Cliquez sur **"CRÉER"**
5. Attendez quelques secondes que le projet soit créé
6. Sélectionnez votre nouveau projet dans le sélecteur

---

## 🔧 Étape 2 : Configurer l'écran de consentement OAuth

### 2.1 Accéder à l'écran de consentement
1. Dans le menu de gauche, allez à **"APIs et services"** → **"Écran de consentement OAuth"**
   - Ou directement : https://console.cloud.google.com/apis/credentials/consent
2. Si demandé, sélectionnez votre projet

### 2.2 Choisir le type d'utilisateur
1. Sélectionnez **"Externe"** (pour permettre à n'importe qui de se connecter)
2. Cliquez sur **"CRÉER"**

### 2.3 Remplir les informations de l'application

**Page 1 : Informations sur l'application**
- **Nom de l'application** : `MyBudget+`
- **E-mail d'assistance utilisateur** : Votre email
- **Logo de l'application** : (Optionnel, vous pouvez le laisser vide)
- **Domaine de l'application** : Laissez vide pour le développement
- **Liens** : Laissez vides
- **Adresses e-mail du développeur** : Votre email
- Cliquez sur **"ENREGISTRER ET CONTINUER"**

**Page 2 : Champs d'application (Scopes)**
1. Cliquez sur **"AJOUTER OU SUPPRIMER DES CHAMPS D'APPLICATION"**
2. Sélectionnez :
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. Cliquez sur **"METTRE À JOUR"**
4. Cliquez sur **"ENREGISTRER ET CONTINUER"**

**Page 3 : Utilisateurs test**
1. Cliquez sur **"+ AJOUTER DES UTILISATEURS"**
2. Ajoutez votre adresse email (et celles des testeurs)
3. Cliquez sur **"AJOUTER"**
4. Cliquez sur **"ENREGISTRER ET CONTINUER"**

**Page 4 : Résumé**
1. Vérifiez les informations
2. Cliquez sur **"RETOUR AU TABLEAU DE BORD"**

---

## 🔐 Étape 3 : Créer les identifiants OAuth

### 3.1 Accéder à la page des identifiants
1. Dans le menu de gauche, allez à **"APIs et services"** → **"Identifiants"**
   - Ou directement : https://console.cloud.google.com/apis/credentials
2. Cliquez sur **"+ CRÉER DES IDENTIFIANTS"** en haut
3. Sélectionnez **"ID client OAuth"**

### 3.2 Configurer l'ID client OAuth

1. **Type d'application** : Sélectionnez **"Application Web"**

2. **Nom** : `MyBudget+ Web Client`

3. **Origines JavaScript autorisées** :
   - Cliquez sur **"+ AJOUTER UN URI"**
   - Ajoutez : `http://localhost:5173` (frontend)
   - Cliquez sur **"+ AJOUTER UN URI"** à nouveau
   - Ajoutez : `http://localhost:3001` (backend)

4. **URI de redirection autorisés** :
   - Cliquez sur **"+ AJOUTER UN URI"**
   - Ajoutez : `http://localhost:3001/api/auth/google/callback`

5. Cliquez sur **"CRÉER"**

### 3.3 Récupérer vos identifiants

Une popup s'affiche avec :
- **ID client** : `123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
- **Code secret du client** : `GOCSPX-xxxxxxxxxxxxxxxx`

⚠️ **IMPORTANT** : Copiez ces deux valeurs, vous en aurez besoin !

---

## ⚙️ Étape 4 : Configurer MyBudget+

### 4.1 Modifier le fichier .env du backend

1. Ouvrez le fichier `backend\.env`

2. Décommentez et remplissez les lignes Google OAuth :

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

3. **Remplacez** les valeurs par celles copiées à l'étape 3.3

4. Sauvegardez le fichier

### 4.2 Redémarrer le backend

1. Arrêtez le backend (Ctrl+C)
2. Redémarrez avec `npm run dev`
3. Vous devriez voir : `✅ Google OAuth configured` au démarrage

---

## 🎨 Étape 5 : Ajouter le bouton Google dans le frontend

### 5.1 Modifier la page de connexion

Ouvrez `apps/web/src/Pages/LoginPage.jsx` et ajoutez le bouton Google :

```jsx
// Après le bouton de connexion principal, ajoutez :

<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
    </div>
  </div>

  <div className="mt-6">
    <button
      type="button"
      onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}
      className="w-full flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Se connecter avec Google
    </button>
  </div>
</div>
```

### 5.2 Modifier la page d'inscription

Faites la même chose dans `apps/web/src/Pages/SignUpPage.jsx`

---

## ✅ Étape 6 : Tester l'authentification

### 6.1 Démarrer l'application

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

### 6.2 Tester la connexion

1. Ouvrez http://localhost:5173
2. Allez sur la page de connexion
3. Cliquez sur **"Se connecter avec Google"**
4. Sélectionnez votre compte Google
5. Acceptez les permissions (la première fois)
6. Vous devriez être redirigé et connecté ! 🎉

---

## 🔍 Étape 7 : Vérification et dépannage

### Vérifier que ça fonctionne

1. Dans la console du backend, vous devriez voir :
   ```
   ✅ Google OAuth configured
   ```

2. Lors de la connexion Google, vérifiez :
   - La redirection vers Google fonctionne
   - Vous pouvez sélectionner votre compte
   - Vous êtes redirigé vers votre application
   - Vous recevez un token JWT

### Problèmes courants

#### ❌ Erreur : "redirect_uri_mismatch"

**Cause** : L'URI de redirection ne correspond pas

**Solution** :
1. Vérifiez que dans Google Console, vous avez bien ajouté :
   `http://localhost:3001/api/auth/google/callback`
2. Vérifiez que dans `backend\.env`, `GOOGLE_CALLBACK_URL` est identique

#### ❌ Erreur : "Access blocked: This app's request is invalid"

**Cause** : Problème avec l'écran de consentement

**Solution** :
1. Retournez à l'écran de consentement OAuth
2. Vérifiez que vous avez bien ajouté les scopes (email, profile, openid)
3. Ajoutez votre email dans les utilisateurs test

#### ❌ Erreur : "unauthorized_client"

**Cause** : Les identifiants ne sont pas corrects

**Solution** :
1. Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects
2. Redémarrez le backend après modification

#### ⚠️ Le bouton Google n'apparaît pas

**Solution** :
1. Vérifiez que vous avez bien modifié `LoginPage.jsx`
2. Redémarrez le frontend
3. Videz le cache du navigateur (Ctrl+F5)

---

## 🌐 Étape 8 : Passer en production (Optionnel)

Quand vous déploierez en production :

### 8.1 Mettre à jour Google Cloud Console

1. Retournez dans **"Identifiants"** → Votre ID client OAuth
2. Dans **"Origines JavaScript autorisées"**, ajoutez :
   - `https://votre-domaine.com`
3. Dans **"URI de redirection autorisés"**, ajoutez :
   - `https://votre-domaine.com/api/auth/google/callback`
4. Cliquez sur **"ENREGISTRER"**

### 8.2 Mettre à jour le fichier .env

```env
GOOGLE_CALLBACK_URL=https://votre-domaine.com/api/auth/google/callback
```

### 8.3 Publier l'application

Dans l'écran de consentement OAuth :
1. Cliquez sur **"PUBLIER L'APPLICATION"**
2. Suivez les instructions de vérification Google

⚠️ **Note** : En mode "Test", seuls les utilisateurs ajoutés peuvent se connecter.
En mode "Production", tout le monde peut se connecter.

---

## 📝 Résumé des fichiers modifiés

### Backend
- ✅ `backend/.env` - Ajout des identifiants Google

### Frontend
- ✅ `apps/web/src/Pages/LoginPage.jsx` - Ajout bouton Google
- ✅ `apps/web/src/Pages/SignUpPage.jsx` - Ajout bouton Google

---

## 🎉 Félicitations !

Votre authentification Google OAuth est maintenant configurée !

**Ce qui fonctionne maintenant** :
- ✅ Connexion avec Google
- ✅ Création automatique de compte
- ✅ Linking des comptes existants (même email)
- ✅ Email automatiquement vérifié pour OAuth

---

## 📚 Ressources

- [Documentation Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Passport Google OAuth Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)

---

**Besoin d'aide ?** Consultez la section dépannage ou ouvrez une issue !

