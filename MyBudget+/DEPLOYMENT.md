# Guide de Déploiement - MyBudget+

Ce guide vous explique comment héberger votre application MyBudget+ avec :
- **Frontend** (React/Vite) sur **Vercel** (gratuit)
- **Backend** (Node.js/Express) sur **Render** ou **Railway** (gratuit)
- **Base de données** MongoDB sur **MongoDB Atlas** (gratuit)

## 📋 Prérequis

- Un compte [Vercel](https://vercel.com) (gratuit)
- Un compte [Render](https://render.com) ou [Railway](https://railway.app) (gratuit)
- Un compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit)
- Un compte Gmail pour l'envoi d'emails (ou service SMTP)
- Un compte [reCAPTCHA](https://www.google.com/recaptcha) (gratuit)

---

## 🗄️ ÉTAPE 1 : Configurer MongoDB Atlas

### 1.1 Créer un cluster gratuit
1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster **M0 Free**
4. Sélectionnez une région proche de vous

### 1.2 Créer un utilisateur de base de données
1. Cliquez sur **Database Access** dans le menu
2. Cliquez sur **Add New Database User**
3. Choisissez **Password** comme méthode d'authentification
4. Entrez un nom d'utilisateur et un mot de passe
5. Donnez le rôle **Atlas admin**
6. Cliquez sur **Add User**

### 1.3 Configurer l'accès réseau
1. Cliquez sur **Network Access** dans le menu
2. Cliquez sur **Add IP Address**
3. Cliquez sur **Allow Access from Anywhere** (0.0.0.0/0)
4. Cliquez sur **Confirm**

### 1.4 Obtenir la chaîne de connexion
1. Cliquez sur **Database** dans le menu
2. Cliquez sur **Connect** sur votre cluster
3. Choisissez **Connect your application**
4. Copiez la chaîne de connexion
5. Remplacez `<password>` par votre mot de passe
6. Remplacez `<database-name>` par `mybudget`

**Exemple :**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mybudget?retryWrites=true&w=majority
```

---

## 🔧 ÉTAPE 2 : Configurer le Backend sur Render

### 2.1 Préparer le backend pour le déploiement

Créez un fichier `render.yaml` dans le dossier `backend/` :

```yaml
services:
  - type: web
    name: mybudget-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: SESSION_SECRET
        sync: false
      - key: EMAIL_USER
        sync: false
      - key: EMAIL_PASS
        sync: false
      - key: RECAPTCHA_SECRET_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: PAYPAL_CLIENT_ID
        sync: false
      - key: PAYPAL_CLIENT_SECRET
        sync: false
      - key: PAYPAL_MODE
        value: sandbox
```

### 2.2 Déployer le backend sur Render

1. Allez sur [Render](https://render.com)
2. Créez un compte gratuit
3. Cliquez sur **New +** puis **Web Service**
4. Connectez votre repository GitHub
5. Configurez le service :
   - **Name** : `mybudget-backend`
   - **Region** : Europe (Frankfurt) ou USA
   - **Branch** : `main` ou `master`
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
6. Cliquez sur **Advanced** et ajoutez les variables d'environnement :

```env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mybudget?retryWrites=true&w=majority
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
SESSION_SECRET=votre_secret_session_tres_long_et_aleatoire
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application
RECAPTCHA_SECRET_KEY=votre_cle_recaptcha
FRONTEND_URL=https://votre-app.vercel.app
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
PAYPAL_CLIENT_ID=votre_paypal_client_id
PAYPAL_CLIENT_SECRET=votre_paypal_client_secret
PAYPAL_MODE=sandbox
```

7. Cliquez sur **Create Web Service**
8. Render va déployer votre backend
9. Notez l'URL du backend : `https://mybudget-backend.onrender.com`

**⚠️ Note :** Avec le plan gratuit, le backend se met en veille après 15 minutes d'inactivité. Le premier chargement après une veille peut prendre 30-60 secondes.

---

## 🌐 ÉTAPE 3 : Configurer le Frontend sur Vercel

### 3.1 Créer un fichier `.env.production`

Dans le dossier `apps/web/`, créez un fichier `.env.production` :

```env
VITE_API_URL=https://mybudget-backend.onrender.com/api
```

### 3.2 Déployer le frontend sur Vercel

1. Allez sur [Vercel](https://vercel.com)
2. Créez un compte gratuit
3. Cliquez sur **Add New...** puis **Project**
4. Importez votre repository GitHub
5. Configurez le projet :
   - **Framework Preset** : Vite
   - **Root Directory** : `apps/web`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install`
6. Ajoutez la variable d'environnement :
   - **Name** : `VITE_API_URL`
   - **Value** : `https://mybudget-backend.onrender.com/api`
7. Cliquez sur **Deploy**
8. Vercel va déployer votre frontend
9. Notez l'URL du frontend : `https://votre-app.vercel.app`

### 3.3 Mettre à jour la variable FRONTEND_URL dans Render

1. Retournez sur Render
2. Allez dans les **Environment** de votre backend
3. Mettez à jour `FRONTEND_URL` avec l'URL Vercel
4. Sauvegardez et redémarrez le service

---

## 📧 ÉTAPE 4 : Configurer les Emails (Gmail)

### 4.1 Activer l'authentification à deux facteurs
1. Allez sur [Google Account](https://myaccount.google.com)
2. Cliquez sur **Security**
3. Activez **2-Step Verification**

### 4.2 Générer un mot de passe d'application
1. Dans **Security**, cherchez **App passwords**
2. Cliquez sur **App passwords**
3. Sélectionnez **Mail** et **Other (Custom name)**
4. Entrez "MyBudget" comme nom
5. Cliquez sur **Generate**
6. Copiez le mot de passe (16 caractères sans espaces)

Dans les variables d'environnement de Render :
- `EMAIL_USER` : Votre adresse Gmail complète
- `EMAIL_PASS` : Le mot de passe d'application généré

---

## 🔐 ÉTAPE 5 : Configurer reCAPTCHA

1. Allez sur [reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Cliquez sur **+** pour créer un nouveau site
3. Remplissez :
   - **Label** : MyBudget
   - **reCAPTCHA type** : reCAPTCHA v2
   - **Domains** : `votre-app.vercel.app` (et `localhost` pour le développement)
4. Acceptez les conditions
5. Cliquez sur **Submit**
6. Copiez **Site Key** et **Secret Key**

Dans les variables d'environnement de Render :
- `RECAPTCHA_SECRET_KEY` : La Secret Key copiée

Dans votre code frontend, vous devrez utiliser le Site Key (à configurer séparément dans le frontend).

---

## 🔑 ÉTAPE 6 : Générer les Secrets JWT

Ouvrez un terminal et exécutez :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exécutez cette commande **deux fois** pour obtenir :
- `JWT_SECRET`
- `SESSION_SECRET`

Ajoutez-les dans les variables d'environnement de Render.

---

## ✅ ÉTAPE 7 : Vérifier le Déploiement

1. Visitez votre site Vercel : `https://votre-app.vercel.app`
2. Créez un compte
3. Vérifiez que vous recevez des emails de confirmation
4. Connectez-vous et testez l'application

---

## 🐛 Dépannage

### Le backend ne démarre pas
- Vérifiez que toutes les variables d'environnement sont correctement définies
- Consultez les logs dans Render
- Vérifiez que MongoDB Atlas accepte les connexions depuis 0.0.0.0/0

### Erreur CORS
- Assurez-vous que `FRONTEND_URL` dans Render correspond exactement à l'URL Vercel
- Vérifiez que l'URL se termine par un `/` si nécessaire

### Les emails ne s'envoient pas
- Vérifiez que vous utilisez un **App Password** et non votre mot de passe Gmail
- Vérifiez que l'authentification à deux facteurs est activée

### Le backend est lent au premier chargement
- C'est normal avec le plan gratuit de Render
- Les requêtes suivantes seront rapides

---

## 📊 Plans de Tarification

### Gratuit (Développement)
- **Vercel** : Illimité
- **Render** : Backend gratuit (15 min de timeout, veille après inactivité)
- **MongoDB Atlas** : 512 MB de stockage

### Payant (Production)
- **Vercel Pro** : $20/mois
- **Render Standard** : $7/mois
- **MongoDB Atlas M10** : ~$50/mois

---

## 🔄 Mises à Jour

Pour déployer une mise à jour :
1. Committez vos changements sur GitHub
2. Push sur la branche `main` ou `master`
3. Vercel et Render déploieront automatiquement

---

## 📞 Support

En cas de problème :
1. Consultez les logs dans Vercel et Render
2. Vérifiez que toutes les variables d'environnement sont correctes
3. Testez les API directement avec Postman

**Bon déploiement ! 🚀**
