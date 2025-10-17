# 🚀 Démarrage Rapide - MyBudget+

## ✅ Configuration terminée !

Vos fichiers `.env` ont été créés avec des secrets sécurisés.

## 📋 Étapes pour démarrer

### 1. Démarrer MongoDB

**Option A - Avec Docker (Recommandé)** :
```powershell
docker-compose up -d mongo
```

**Option B - MongoDB local** :
```powershell
mongod
# Ou si installé comme service Windows, il démarre automatiquement
```

### 2. Démarrer le Backend

Dans un terminal PowerShell :
```powershell
cd "MyBudget+\backend"
npm run dev
```

Vous devriez voir :
```
✅ Environment variables validated
⚠️  Google OAuth not configured (optional)
✅ Routes configurées:
Server running on port 3001
```

### 3. Démarrer le Frontend

Dans un **nouveau** terminal PowerShell :
```powershell
cd "MyBudget+\apps\web"
npm run dev
```

Vous devriez voir :
```
VITE ready in X ms
➜  Local:   http://localhost:5173/
```

### 4. Accéder à l'application

Ouvrez votre navigateur :
- 🌐 **Frontend** : http://localhost:5173
- 🔌 **API** : http://localhost:3001/api/health

## ✅ Configuration actuelle

### Backend (.env créé)
- ✅ JWT_SECRET : Configuré (secret unique généré)
- ✅ SESSION_SECRET : Configuré (secret unique généré)
- ✅ MONGO_URI : mongodb://localhost:27017/mybudget
- ✅ FRONTEND_URL : http://localhost:5173
- ⚠️  Email SMTP : Non configuré (optionnel)
- ⚠️  Google OAuth : Non configuré (optionnel)

### Frontend (.env créé)
- ✅ VITE_API_URL : http://localhost:3001/api

## 🔐 Fonctionnalités disponibles

**Sans configuration supplémentaire** :
- ✅ Inscription / Connexion avec email et mot de passe
- ✅ Gestion des transactions
- ✅ Gestion des budgets
- ✅ Tableaux de bord
- ✅ Rapports
- ✅ Import/Export

**Nécessite configuration** :
- ❌ Connexion avec Google (nécessite GOOGLE_CLIENT_ID)
- ❌ Reset de mot de passe par email (nécessite SMTP)

## 📧 Configuration Email (Optionnel)

Si vous voulez activer le reset de mot de passe par email :

1. Éditez `backend\.env`
2. Décommentez et remplissez :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
```

**Pour Gmail** : Créez un "mot de passe d'application" sur https://myaccount.google.com/apppasswords

## 🔑 Configuration Google OAuth (Optionnel)

Si vous voulez activer la connexion avec Google :

1. Créez un projet sur https://console.cloud.google.com/
2. Activez l'API Google+
3. Créez des identifiants OAuth 2.0
4. Éditez `backend\.env` et décommentez :
```env
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

## 🛠️ Commandes utiles

### Backend
```powershell
cd backend
npm run dev      # Mode développement (avec auto-reload)
npm start        # Mode production
```

### Frontend
```powershell
cd apps\web
npm run dev      # Serveur de développement
npm run build    # Build pour production
npm run preview  # Prévisualiser le build
```

### Docker
```powershell
# Démarrer tout (MongoDB + Backend + Frontend)
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tout
docker-compose down
```

## ❓ Problèmes courants

### MongoDB ne démarre pas
```powershell
# Vérifier si MongoDB est installé
mongod --version

# Avec Docker
docker-compose up -d mongo
docker-compose logs mongo
```

### Port 3001 déjà utilisé
```powershell
# Trouver et arrêter le processus
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou changer le port dans backend\.env
PORT=3002
```

### Erreur CORS
Vérifiez que `FRONTEND_URL` dans `backend\.env` correspond à l'URL de votre frontend (par défaut http://localhost:5173)

## 📚 Documentation complète

- `README.md` : Documentation générale
- `INSTALLATION.md` : Guide d'installation détaillé
- `SECURITY.md` : Sécurité et bonnes pratiques
- `CORRECTIONS_APPLIQUEES.md` : Résumé des améliorations

## 🎉 C'est prêt !

Votre application MyBudget+ est configurée et prête à être utilisée !

**Prochaines étapes** :
1. Créez un compte utilisateur
2. Ajoutez vos premières transactions
3. Configurez vos budgets
4. Explorez les rapports

---

Bon développement ! 💰✨

