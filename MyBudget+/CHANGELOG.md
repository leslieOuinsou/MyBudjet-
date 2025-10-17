# 📝 Changelog - MyBudget+

Tous les changements notables de ce projet sont documentés dans ce fichier.

## [1.0.0] - 2024-10-14

### 🔒 Sécurité (CRITIQUE)

#### Corrigé
- **Secrets hardcodés supprimés** : JWT_SECRET et SESSION_SECRET ne sont plus dans le code
- **CORS configuré correctement** : Restriction aux origines autorisées uniquement
- **Protection CSRF repositionnée** : Middleware déplacé avant les routes
- **Rate limiting ajouté** : 
  - Limite générale : 100 requêtes / 15 minutes
  - Limite auth : 5 tentatives / 15 minutes
- **Validation des données améliorée** : Utilisation de Joi pour toutes les entrées utilisateur
- **Gestion des erreurs globale** : Middleware de gestion d'erreurs complet
- **Modèle User sécurisé** : 
  - Champs sensibles masqués automatiquement
  - Validation stricte des mots de passe (12+ caractères, complexité)
  - Index pour optimisation
- **Sessions sécurisées** : Configuration avec httpOnly, secure en production

### ✨ Nouvelles fonctionnalités

#### Ajouté
- **Validation Joi complète** :
  - `authValidator.js` : Validation authentification
  - `transactionValidator.js` : Validation transactions
  - `budgetValidator.js` : Validation budgets
- **Fichiers de configuration** :
  - `.env.example` pour backend et frontend
  - `Dockerfile` optimisé pour production
  - `.gitignore` complet
- **Middleware d'erreurs global** : Gestion centralisée de toutes les erreurs
- **Modèle User amélioré** :
  - `emailVerified`, `lastLogin`, `resetPasswordToken`
  - `preferences` (devise, langue, notifications)
  - Méthodes virtuelles pour le profil
- **Documentation complète** :
  - `README.md` : Guide d'utilisation
  - `SECURITY.md` : Rapport et recommandations de sécurité
  - `INSTALLATION.md` : Guide d'installation détaillé
  - `CHANGELOG.md` : Ce fichier

### 🔧 Améliorations

#### Modifié
- **backend/src/index.js** :
  - Import de dotenv en premier
  - Configuration CORS stricte
  - Rate limiting global et spécifique
  - Middleware CSRF avant les routes
  - Middleware d'erreurs global
  - Validation des variables d'environnement au démarrage
  - Suppression de la route forecast dupliquée
- **backend/src/middleware/auth.js** :
  - Suppression du fallback JWT_SECRET
  - Vérification du compte bloqué
  - Mise à jour de lastLogin
  - Gestion des erreurs JWT améliorée
- **backend/src/controllers/authController.js** :
  - Vérification compte bloqué au login
  - Gestion des comptes sans mot de passe
  - Mise à jour lastLogin
  - Rôle utilisateur inclus dans la réponse
- **backend/src/config/passport.js** :
  - Suppression des fallbacks pour secrets Google
  - Vérification compte bloqué dans JWT Strategy
  - Linking automatique des comptes Google existants
  - emailVerified défini à true pour OAuth
- **apps/web/src/api.js** :
  - URL API corrigée pour inclure `/api`
- **docker-compose.yml** :
  - Suppression de PostgreSQL (non utilisé)
  - Correction du chemin vers `./backend`
  - Variables d'environnement depuis fichier .env
  - Health check ajouté
  - Suppression du volume pg_data

### 📦 Dépendances

#### Ajouté
- `dotenv@^16.3.1` : Gestion des variables d'environnement
- `express-rate-limit@^7.1.5` : Rate limiting
- `joi@^17.11.0` : Validation des données

### 🗂️ Structure de fichiers

#### Nouveaux fichiers
```
MyBudget+/
├── backend/
│   ├── .env.example              # Exemple variables d'environnement
│   ├── Dockerfile                # Docker pour le backend
│   ├── src/
│   │   └── validators/
│   │       ├── authValidator.js       # Validation authentification
│   │       ├── transactionValidator.js # Validation transactions
│   │       └── budgetValidator.js     # Validation budgets
│   ├── uploads/.gitkeep
│   └── tmp/.gitkeep
├── apps/web/
│   └── .env.example              # Exemple variables d'environnement frontend
├── .gitignore                    # Fichiers à ignorer par Git
├── README.md                     # Documentation principale
├── SECURITY.md                   # Rapport de sécurité
├── INSTALLATION.md               # Guide d'installation
└── CHANGELOG.md                  # Ce fichier
```

### 🐛 Corrections de bugs

#### Corrigé
- URL API incorrecte dans le frontend (manquait `/api`)
- Route forecast dupliquée dans index.js
- Middleware CSRF appliqué après les routes
- MongoDB URI sans validation au démarrage
- Session secret hardcodé
- Pas de vérification des comptes bloqués
- Pas de mise à jour de lastLogin

### 🔐 Politique de sécurité

#### Mots de passe
Nouvelle exigence stricte :
- Minimum 12 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule  
- Au moins 1 chiffre
- Au moins 1 caractère spécial (@$!%*?&)

#### Rate Limiting
- API générale : 100 requêtes / 15 minutes par IP
- Login/Register : 5 tentatives / 15 minutes par IP
- Succès de login non comptabilisés

#### CORS
- Origine : FRONTEND_URL uniquement (pas de wildcard)
- Credentials : true
- Méthodes : GET, POST, PUT, DELETE, PATCH
- Headers : Content-Type, Authorization

### ⚠️ Breaking Changes

#### Variables d'environnement OBLIGATOIRES
Ces variables doivent maintenant être définies (plus de fallback) :
- `JWT_SECRET` : Secret pour les tokens JWT
- `SESSION_SECRET` : Secret pour les sessions
- `MONGO_URI` : URI de connexion MongoDB

L'application **ne démarrera pas** sans ces variables.

#### Validation stricte
Les endpoints suivants appliquent maintenant une validation stricte :
- `POST /api/auth/register` : Validation email, nom, mot de passe
- `POST /api/auth/login` : Validation email, mot de passe
- `POST /api/transactions` : Validation complète des champs
- `PUT /api/transactions/:id` : Validation partielle
- `POST /api/budgets` : Validation complète des champs
- `PUT /api/budgets/:id` : Validation partielle

Les requêtes avec des données invalides retourneront **400 Bad Request** avec détails.

### 📊 Statistiques

- **Fichiers modifiés** : 11
- **Fichiers créés** : 13
- **Lignes de code ajoutées** : ~1500
- **Vulnérabilités corrigées** : 7 critiques, 3 élevées
- **Tests** : À ajouter (recommandé)

### 🚀 Migration depuis version précédente

Si vous upgrader depuis une version précédente :

1. **Créer le fichier .env** :
```bash
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs
```

2. **Installer les nouvelles dépendances** :
```bash
cd backend
npm install
```

3. **Mettre à jour le frontend** :
```bash
cd apps/web
cp .env.example .env
```

4. **Vérifier la configuration Docker** :
```bash
# Si vous utilisiez PostgreSQL, migrez vers MongoDB
docker-compose down -v
# Éditer docker-compose.yml si nécessaire
docker-compose up -d
```

### 📝 Notes de version

Cette version apporte des corrections de sécurité **critiques**. Il est **fortement recommandé** de mettre à jour immédiatement.

### 🎯 Prochaines versions prévues

#### [1.1.0] - À venir
- [ ] Tests unitaires et d'intégration
- [ ] Authentification à deux facteurs (2FA)
- [ ] Vérification par email
- [ ] Monitoring et logs avancés
- [ ] Documentation API (Swagger)

#### [1.2.0] - À venir
- [ ] Webhooks
- [ ] Export automatique programmé
- [ ] Notifications push
- [ ] Dark mode
- [ ] Graphiques avancés

### 🤝 Contributeurs

- Corrections de sécurité majeures
- Amélioration de l'architecture
- Documentation complète

---

Pour toute question sur cette version, consultez :
- [README.md](./README.md) : Documentation générale
- [SECURITY.md](./SECURITY.md) : Détails sécurité
- [INSTALLATION.md](./INSTALLATION.md) : Guide d'installation

**Note** : Conservez toujours une sauvegarde avant de mettre à jour !

