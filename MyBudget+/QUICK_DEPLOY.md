# 🚀 Déploiement Rapide - MyBudget+

Guide étape par étape pour héberger votre application en 15 minutes.

## 📦 Ce dont vous avez besoin

- [x] Un compte GitHub avec votre code
- [ ] Un compte [Vercel](https://vercel.com) (gratuit)
- [ ] Un compte [Render](https://render.com) (gratuit)
- [ ] Un compte [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuit)

---

## 🔥 Déploiement en 5 étapes

### 1️⃣ MongoDB Atlas (5 minutes)

1. Créez un cluster gratuit M0
2. Créez un utilisateur (username/password)
3. Configurez le réseau : Ajoutez `0.0.0.0/0` (Allow all)
4. Copiez la connection string
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mybudget?retryWrites=true&w=majority
   ```

### 2️⃣ Générez vos secrets JWT (1 minute)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exécutez **2 fois** pour obtenir `JWT_SECRET` et `SESSION_SECRET`.

### 3️⃣ Déployez le backend sur Render (5 minutes)

1. Allez sur https://render.com
2. **New +** → **Web Service**
3. Connectez votre repo GitHub
4. Configurez :
   - **Name** : `mybudget-backend`
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Ajoutez ces variables d'environnement :
   ```
   NODE_ENV=production
   PORT=3001
   MONGO_URI=... (depuis MongoDB Atlas)
   JWT_SECRET=... (secret généré)
   SESSION_SECRET=... (secret généré)
   FRONTEND_URL=https://votre-app.vercel.app (à mettre à jour après Vercel)
   EMAIL_USER=votre@gmail.com
   EMAIL_PASS=votre_app_password_gmail
   ```
6. Cliquez **Create**

### 4️⃣ Déployez le frontend sur Vercel (2 minutes)

1. Allez sur https://vercel.com
2. **Add New Project**
3. Importez votre repo
4. Configurez :
   - **Framework Preset** : Vite
   - **Root Directory** : `apps/web`
5. Ajoutez la variable :
   ```
   VITE_API_URL=https://mybudget-backend.onrender.com/api
   ```
6. Cliquez **Deploy**

### 5️⃣ Mettez à jour FRONTEND_URL (1 minute)

1. Retournez sur Render
2. Allez dans votre service backend
3. **Environment** → Modifiez `FRONTEND_URL` avec l'URL Vercel
4. Sauvegardez

---

## ✅ C'est tout !

Votre application est en ligne ! 🎉

### 🔗 Liens
- Frontend : `https://votre-app.vercel.app`
- Backend : `https://mybudget-backend.onrender.com`

---

## ⚠️ Configuration des emails

Pour activer les emails, vous devez :

1. Activer 2-Step Verification sur Gmail
2. Créer un App Password :
   - https://myaccount.google.com/apppasswords
   - Sélectionnez "Mail"
   - Copiez le mot de passe (16 caractères)
3. Utilisez ce mot de passe dans `EMAIL_PASS` sur Render

---

## 🐛 Problèmes courants

**Backend lent au démarrage ?**
- Normal avec le plan gratuit (première requête après veille)

**Erreur CORS ?**
- Vérifiez que `FRONTEND_URL` = URL Vercel exacte

**Pas d'emails ?**
- Utilisez un **App Password** Gmail, pas votre mot de passe normal

---

## 📚 Documentation complète

Consultez `DEPLOYMENT.md` pour plus de détails.
