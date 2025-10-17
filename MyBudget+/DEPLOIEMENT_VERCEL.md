# 🚀 Guide de Déploiement Vercel - MyBudget+

## 📋 Vue d'ensemble

MyBudget+ est déployé en **2 projets séparés** sur Vercel :
1. **Backend (API)** - Express.js + MongoDB
2. **Frontend (React)** - Vite + React

---

## ✅ Fichiers de configuration créés

- `MyBudget+/apps/web/vercel.json` - Configuration frontend
- `MyBudget+/backend/vercel.json` - Configuration backend

---

## 🎯 Étapes de déploiement

### 📦 PARTIE 1 : Backend (API)

#### 1️⃣ Préparer MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte / Connectez-vous
3. Créez un **cluster gratuit** (M0)
4. **Database Access** → Add New Database User
   - Username : `mybudget-admin`
   - Password : (générez un mot de passe fort)
   - Built-in Role : `Read and write to any database`
5. **Network Access** → Add IP Address
   - Choisissez : `0.0.0.0/0` (Allow from anywhere)
   - Confirmez
6. **Connect** → Drivers → Node.js
   - Copiez la **connection string**
   - Format : `mongodb+srv://username:password@cluster.mongodb.net/mybudget`
   - ⚠️ Remplacez `<password>` par votre mot de passe

#### 2️⃣ Déployer le Backend sur Vercel

1. Allez sur [Vercel](https://vercel.com)
2. Cliquez sur **"New Project"**
3. Importez votre repository GitHub (ou uploadez le dossier)
4. **Configuration** :
   - **Project Name** : `mybudget-backend`
   - **Root Directory** : `MyBudget+/backend` ⚠️ IMPORTANT
   - **Framework Preset** : `Other`
   - **Build Command** : (laissez vide)
   - **Output Directory** : (laissez vide)
   - **Install Command** : `npm install`

#### 3️⃣ Variables d'environnement Backend

Dans **Settings** → **Environment Variables**, ajoutez :

| Nom | Valeur | Description |
|-----|--------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | URI de connexion MongoDB Atlas |
| `JWT_SECRET` | Générez une clé aléatoire de 64 caractères | Clé pour les tokens JWT |
| `NODE_ENV` | `production` | Environnement de production |
| `FRONTEND_URL` | `https://votre-frontend.vercel.app` | URL du frontend (à ajouter après étape 5) |
| `ADMIN_CREATION_CODE` | `MYBUDGET-ADMIN-2025` | Code pour créer des admins |

**Variables optionnelles** (pour Google OAuth et emails) :
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `EMAIL_USER`
- `EMAIL_PASS`

#### 4️⃣ Notez l'URL du Backend

Une fois déployé, notez l'URL de votre backend :
```
https://mybudget-backend-xxxx.vercel.app
```

---

### 🎨 PARTIE 2 : Frontend (React)

#### 5️⃣ Déployer le Frontend sur Vercel

1. Vercel → **"New Project"**
2. Importez le même repository (ou uploadez)
3. **Configuration** :
   - **Project Name** : `mybudget-frontend`
   - **Root Directory** : `MyBudget+/apps/web` ⚠️ IMPORTANT
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`

#### 6️⃣ Variables d'environnement Frontend

Dans **Settings** → **Environment Variables**, ajoutez :

| Nom | Valeur | Description |
|-----|--------|-------------|
| `VITE_API_URL` | `https://votre-backend.vercel.app/api` | URL de l'API backend (de l'étape 4) |

⚠️ **Important** : Remplacez par l'URL réelle de votre backend !

#### 7️⃣ Redéployer le Frontend

Après avoir ajouté la variable d'environnement :
1. **Deployments** → Cliquez sur le dernier déploiement
2. **...** → **Redeploy**

#### 8️⃣ Mettre à jour la variable FRONTEND_URL du Backend

Maintenant que vous avez l'URL du frontend :
1. Retournez au projet **Backend** sur Vercel
2. **Settings** → **Environment Variables**
3. Modifiez `FRONTEND_URL` avec l'URL de votre frontend
4. **Deployments** → **Redeploy**

---

## 🔧 POST-DÉPLOIEMENT

### 9️⃣ Vérifier CORS (Backend)

Le fichier `MyBudget+/backend/src/index.js` doit déjà contenir la configuration CORS correcte avec `process.env.FRONTEND_URL`.

Si vous avez plusieurs domaines frontend, vérifiez que tous sont dans la liste CORS.

### 🔟 Créer le premier administrateur

**Option 1 : Via MongoDB Compass** (recommandé)
1. Téléchargez [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connectez-vous avec votre URI MongoDB Atlas
3. Accédez à la collection `users`
4. Trouvez votre utilisateur
5. Modifiez le champ `role` : `"user"` → `"admin"`
6. Sauvegardez

**Option 2 : Via l'interface admin**
1. Allez sur `https://votre-frontend.vercel.app/admin/signup`
2. Remplissez le formulaire
3. **Code d'activation** : `MYBUDGET-ADMIN-2025`
4. ⚠️ Cette page nécessite d'être déjà connecté en tant qu'admin

---

## ✅ Tests Post-Déploiement

### Testez les fonctionnalités suivantes :

- [ ] **Inscription utilisateur** (`/signup`)
- [ ] **Connexion utilisateur** (`/login`)
- [ ] **Création d'un budget**
- [ ] **Ajout d'une transaction**
- [ ] **Connexion admin** (`/admin/login`)
- [ ] **Dashboard admin** (`/admin`)
- [ ] **Mode sombre**
- [ ] **Responsive mobile**

---

## 🐛 Dépannage

### Erreur CORS
**Symptôme** : `Access-Control-Allow-Origin error`
**Solution** : Vérifiez que `FRONTEND_URL` est correctement configuré dans le backend

### Erreur 404 sur routes frontend
**Symptôme** : Rafraîchir la page donne une erreur 404
**Solution** : Vérifiez que `vercel.json` du frontend contient les rewrites

### Erreur MongoDB connexion
**Symptôme** : `MongoServerError: Authentication failed`
**Solution** : 
- Vérifiez `MONGODB_URI` dans les variables d'environnement
- Vérifiez que le mot de passe est correct (sans caractères spéciaux non encodés)
- Vérifiez Network Access sur MongoDB Atlas (0.0.0.0/0)

### Variables d'environnement non prises en compte
**Symptôme** : Les modifications ne sont pas appliquées
**Solution** : Après chaque modification de variable, redéployez le projet

---

## 📝 Checklist finale

- [ ] Backend déployé sur Vercel
- [ ] MongoDB Atlas configuré et accessible
- [ ] Toutes les variables d'environnement backend ajoutées
- [ ] Frontend déployé sur Vercel
- [ ] Variable `VITE_API_URL` configurée
- [ ] Variable `FRONTEND_URL` du backend mise à jour
- [ ] Premier admin créé
- [ ] Tests fonctionnels réussis

---

## 🎉 Félicitations !

Votre application MyBudget+ est maintenant déployée et accessible en ligne !

**URLs de production :**
- Frontend : `https://mybudget-frontend-xxxx.vercel.app`
- Backend API : `https://mybudget-backend-xxxx.vercel.app/api`

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs dans Vercel Dashboard
2. Vérifiez la console du navigateur (F12)
3. Consultez la documentation Vercel

