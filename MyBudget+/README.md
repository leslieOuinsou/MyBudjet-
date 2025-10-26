# 💰 MyBudget+ - Gestionnaire de Finances Personnelles

Application complète de gestion de finances personnelles avec backend Node.js, frontend React et application mobile React Native.

## 🚀 Hébergement

Votre application est prête à être hébergée ! Consultez les guides :

- 📖 **[Guide de déploiement complet](DEPLOYMENT.md)** - Documentation détaillée
- ⚡ **[Déploiement rapide](QUICK_DEPLOY.md)** - En ligne en 15 minutes

Services recommandés (100% gratuit) :
- **Frontend** : Vercel
- **Backend** : Render
- **Base de données** : MongoDB Atlas

## 🎯 Fonctionnalités

- ✅ Authentification sécurisée (JWT + OAuth Google)
- 💳 Gestion des portefeuilles et transactions
- 📊 Tableaux de bord et rapports détaillés
- 📈 Prévisions financières
- 💵 Gestion des budgets avec alertes
- 🔔 Rappels de factures
- 📱 Application mobile (iOS & Android)
- 📥 Import/Export (CSV, Excel, PDF)
- 🔒 Sécurité renforcée (Rate limiting, CSRF, Helmet)

## 🚀 Démarrage rapide

### Prérequis

- Node.js >= 18.x
- MongoDB >= 6.x
- npm ou yarn

### Installation

1. **Cloner le repository**
```bash
git clone <votre-repo>
cd MyBudget+
```

2. **Installer les dépendances**
```bash
# Backend
cd backend
npm install

# Frontend Web
cd ../apps/web
npm install

# Mobile (optionnel)
cd ../mobile
npm install
```

3. **Configuration des variables d'environnement**

**Backend** - Copiez `.env.example` vers `.env`:
```bash
cd backend
cp .env.example .env
```

Puis éditez `.env` et remplissez les valeurs :
```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mybudget

# IMPORTANT: Changez ces secrets en production !
JWT_SECRET=votre_secret_jwt_très_long_et_aléatoire
SESSION_SECRET=votre_secret_session_très_long_et_aléatoire

# Configuration email (pour reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application

# OAuth Google (optionnel)
GOOGLE_CLIENT_ID=votre_client_id
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# URL Frontend
FRONTEND_URL=http://localhost:5173
```

**Frontend Web** - Copiez `.env.example` vers `.env`:
```bash
cd apps/web
cp .env.example .env
```

Contenu du `.env` :
```env
VITE_API_URL=http://localhost:3001/api
```

4. **Démarrer MongoDB**
```bash
# Avec Docker
docker-compose up -d mongo

# Ou localement si déjà installé
mongod
```

5. **Démarrer l'application**

Dans des terminaux séparés :

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend Web (terminal 2)
cd apps/web
npm run dev
```

6. **Accéder à l'application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

## 🐳 Docker

Pour lancer toute l'application avec Docker :

```bash
# Créez d'abord un .env à la racine avec vos secrets
echo "JWT_SECRET=votre_secret_jwt" > .env
echo "SESSION_SECRET=votre_secret_session" >> .env

# Lancez les containers
docker-compose up -d
```

## 📁 Structure du projet

```
MyBudget+/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── config/         # Configuration (Passport, etc.)
│   │   ├── controllers/    # Logique métier
│   │   ├── middleware/     # Middlewares (auth, upload, etc.)
│   │   ├── models/         # Modèles MongoDB
│   │   ├── routes/         # Routes API
│   │   ├── validators/     # Validation Joi
│   │   └── index.js        # Point d'entrée
│   ├── uploads/            # Fichiers uploadés
│   ├── .env.example        # Exemple variables d'env
│   └── package.json
│
├── apps/
│   ├── web/                # Frontend React + Vite
│   │   ├── src/
│   │   │   ├── Pages/      # Pages de l'application
│   │   │   ├── components/ # Composants réutilisables
│   │   │   ├── api.js      # Client API
│   │   │   └── main.jsx    # Point d'entrée
│   │   └── package.json
│   │
│   └── mobile/             # Application React Native
│       └── package.json
│
├── docker-compose.yml      # Configuration Docker
└── README.md              # Ce fichier
```

## 🔐 Sécurité

### Fonctionnalités de sécurité implémentées

✅ **Authentification & Autorisation**
- JWT avec expiration (7 jours)
- Mots de passe hashés avec bcrypt (10 rounds)
- Validation stricte des mots de passe (12+ caractères, majuscules, chiffres, caractères spéciaux)
- OAuth 2.0 Google
- Sessions sécurisées

✅ **Protection des API**
- Rate limiting (100 req/15min général, 5 req/15min pour login)
- CSRF protection
- CORS configuré
- Helmet pour headers HTTP sécurisés
- Validation des données avec Joi

✅ **Gestion des erreurs**
- Middleware global de gestion d'erreurs
- Messages d'erreur appropriés (pas de leak d'info en production)
- Logging des erreurs

### Recommandations de sécurité

🔒 **En production** :
1. Utilisez des secrets forts (32+ caractères aléatoires)
2. Activez HTTPS
3. Configurez `NODE_ENV=production`
4. Utilisez MongoDB avec authentification
5. Mettez à jour régulièrement les dépendances
6. Configurez un reverse proxy (nginx)
7. Activez les backups automatiques

## 📊 API Endpoints

### Authentification
```
POST   /api/auth/register     - Inscription
POST   /api/auth/login        - Connexion
GET    /api/auth/google       - OAuth Google
```

### Utilisateurs
```
GET    /api/users/me          - Profil utilisateur
PUT    /api/users/me          - Modifier profil
```

### Transactions
```
GET    /api/transactions      - Liste des transactions
POST   /api/transactions      - Créer une transaction
PUT    /api/transactions/:id  - Modifier une transaction
DELETE /api/transactions/:id  - Supprimer une transaction
```

### Budgets
```
GET    /api/budgets           - Liste des budgets
POST   /api/budgets           - Créer un budget
PUT    /api/budgets/:id       - Modifier un budget
DELETE /api/budgets/:id       - Supprimer un budget
```

### Rapports
```
GET    /api/reports/stats            - Statistiques financières
GET    /api/reports/categories       - Analyse par catégorie
GET    /api/reports/top-transactions - Top transactions
GET    /api/reports/trends           - Tendances mensuelles
```

### Import/Export
```
POST   /api/importexport/import      - Importer transactions
GET    /api/importexport/export/csv  - Export CSV
GET    /api/importexport/export/excel - Export Excel
GET    /api/importexport/export/pdf   - Export PDF
```

[Documentation complète de l'API disponible sur demande]

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd apps/web
npm test
```

## 📝 Scripts disponibles

### Backend
```bash
npm start       # Démarrer en production
npm run dev     # Démarrer en mode développement (nodemon)
```

### Frontend Web
```bash
npm run dev     # Serveur de développement
npm run build   # Build pour production
npm run preview # Prévisualiser le build
npm run lint    # Linter le code
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation dans `/docs`

## 🎉 Changelog

### Version 1.0.0 (Actuelle)
- ✅ Corrections de sécurité majeures
- ✅ Ajout validation Joi
- ✅ Amélioration du modèle User
- ✅ Rate limiting
- ✅ Middleware d'erreurs global
- ✅ Configuration CORS appropriée
- ✅ Suppression des secrets hardcodés
- ✅ Docker optimisé
- ✅ Documentation complète

---

Fait avec ❤️ pour une meilleure gestion de vos finances personnelles

