# 📦 Guide d'installation - MyBudget+

## Installation rapide (Développement)

### 1️⃣ Prérequis

Installez les logiciels suivants :
- **Node.js** 18.x ou supérieur : https://nodejs.org/
- **MongoDB** 6.x ou supérieur : https://www.mongodb.com/try/download/community
- **Git** : https://git-scm.com/downloads

### 2️⃣ Installation

```bash
# 1. Cloner le repository
git clone <votre-repo>
cd MyBudget+

# 2. Installer les dépendances du backend
cd backend
npm install

# 3. Installer les dépendances du frontend
cd ../apps/web
npm install

# 4. Revenir à la racine
cd ../..
```

### 3️⃣ Configuration

#### Backend

```bash
cd backend

# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env
# Sur Windows : notepad .env
# Sur Mac/Linux : nano .env
```

**Modifiez ces valeurs dans `.env` :**
```env
# Générez des secrets forts avec : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<générez un secret fort ici>
SESSION_SECRET=<générez un autre secret fort ici>

# Si vous utilisez Gmail pour les emails de reset
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application_gmail
```

> **Note** : Pour Gmail, créez un "mot de passe d'application" depuis https://myaccount.google.com/apppasswords

#### Frontend Web

```bash
cd apps/web

# Copier le fichier d'exemple
cp .env.example .env

# Le contenu par défaut est correct pour le développement
```

### 4️⃣ Générer des secrets forts

**Générez vos secrets** avec cette commande Node.js :

```bash
# Ouvrez un terminal Node
node

# Dans le REPL Node, exécutez :
require('crypto').randomBytes(32).toString('hex')

# Répétez pour avoir 2 secrets différents
# Copiez-collez ces valeurs dans votre .env
```

### 5️⃣ Démarrer MongoDB

#### Option A : MongoDB installé localement

```bash
# Démarrer MongoDB
mongod

# Dans un autre terminal, vérifier la connexion
mongo
```

#### Option B : Docker

```bash
# Depuis la racine du projet
docker-compose up -d mongo

# Vérifier que MongoDB fonctionne
docker ps
```

### 6️⃣ Lancer l'application

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

Vous devriez voir :
```
✅ Routes configurées:
   - /api/reports/stats
   - /api/reports/categories
   ...
Server running on port 3001
```

**Terminal 2 - Frontend :**
```bash
cd apps/web
npm run dev
```

Vous devriez voir :
```
  VITE v7.1.2  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 7️⃣ Accéder à l'application

Ouvrez votre navigateur :
- **Frontend** : http://localhost:5173
- **API Backend** : http://localhost:3001/api/health

## ⚠️ Problèmes courants

### MongoDB ne démarre pas

**Erreur** : `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions** :
1. Vérifiez que MongoDB est installé : `mongod --version`
2. Démarrez MongoDB : `mongod` (ou `brew services start mongodb-community` sur Mac)
3. Vérifiez le port : MongoDB doit écouter sur 27017
4. Changez l'URL dans `.env` si nécessaire

### Variables d'environnement manquantes

**Erreur** : `❌ JWT_SECRET is not defined in environment variables`

**Solution** :
1. Vérifiez que le fichier `.env` existe dans `backend/`
2. Vérifiez qu'il contient toutes les variables requises
3. Redémarrez le serveur backend

### Port déjà utilisé

**Erreur** : `Error: listen EADDRINUSE: address already in use :::3001`

**Solutions** :
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9

# Ou changez le port dans .env
PORT=3002
```

### CORS Errors

**Erreur** : `Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS`

**Solutions** :
1. Vérifiez que `FRONTEND_URL` dans `.env` backend est correct
2. Vérifiez que le backend est démarré
3. Videz le cache du navigateur

### Échec de connexion à l'API

**Erreur** : `Failed to fetch` ou `Network Error`

**Solutions** :
1. Vérifiez que le backend est démarré
2. Vérifiez que `VITE_API_URL` dans `apps/web/.env` est correct
3. Testez l'API directement : http://localhost:3001/api/health

## 🐳 Installation avec Docker (Recommandé pour production)

### 1. Prérequis
- Docker : https://docs.docker.com/get-docker/
- Docker Compose : https://docs.docker.com/compose/install/

### 2. Configuration

```bash
# Créez un fichier .env à la racine
cat > .env << EOF
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOF

# Vérifiez le contenu
cat .env
```

### 3. Démarrage

```bash
# Construire et démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

### 4. Arrêt

```bash
# Arrêter les services
docker-compose down

# Supprimer aussi les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 📱 Installation Mobile (Optionnel)

```bash
cd apps/mobile

# Installer les dépendances
npm install

# Installer Expo CLI globalement
npm install -g expo-cli

# Démarrer le serveur de développement
npm start

# Scanner le QR code avec Expo Go (iOS/Android)
```

## 🔧 Dépannage avancé

### Réinstaller toutes les dépendances

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../apps/web
rm -rf node_modules package-lock.json
npm install
```

### Réinitialiser la base de données

```bash
# Avec MongoDB local
mongo
> use mybudget
> db.dropDatabase()

# Avec Docker
docker-compose down -v
docker-compose up -d mongo
```

### Logs de debug

```bash
# Backend avec logs détaillés
cd backend
DEBUG=* npm run dev

# Vérifier les variables d'environnement
node -e "require('dotenv').config(); console.log(process.env)"
```

## 📚 Prochaines étapes

Une fois l'installation terminée :
1. Consultez le [README.md](./README.md) pour les fonctionnalités
2. Lisez [SECURITY.md](./SECURITY.md) pour la sécurité
3. Explorez la documentation dans `/docs`

## 💬 Besoin d'aide ?

- Ouvrez une issue sur GitHub
- Consultez la FAQ
- Contactez le support

---

Bon développement ! 🚀

