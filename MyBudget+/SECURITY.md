# 🔒 Rapport de Sécurité - MyBudget+

## 📋 Résumé

Ce document détaille les corrections de sécurité apportées au projet MyBudget+ et les recommandations pour un déploiement sécurisé.

## ✅ Corrections appliquées

### 1. Secrets hardcodés (CRITIQUE)
**Problème** : Les secrets JWT et session étaient hardcodés dans le code.

**Solution** :
- ✅ Création de fichiers `.env.example`
- ✅ Utilisation de `dotenv` pour charger les variables d'environnement
- ✅ Suppression de tous les fallbacks hardcodés
- ✅ Validation au démarrage que les secrets sont présents

**Fichiers modifiés** :
- `backend/src/index.js`
- `backend/src/middleware/auth.js`
- `backend/src/controllers/authController.js`
- `backend/src/config/passport.js`

### 2. Configuration CORS permissive (CRITIQUE)
**Problème** : CORS acceptait toutes les origines.

**Solution** :
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Protection CSRF mal placée (ÉLEVÉ)
**Problème** : Le middleware CSRF était appliqué après les routes, donc inutile.

**Solution** :
- ✅ Déplacé le middleware CSRF avant les routes
- ✅ Routes d'authentification exclues du CSRF
- ✅ Gestion d'erreur CSRF appropriée

### 4. URL API incorrecte (MOYEN)
**Problème** : L'URL de l'API dans le frontend n'incluait pas `/api`.

**Solution** :
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
```

### 5. Validation des données faible (MOYEN)
**Problème** : Validation manuelle limitée, risque d'injection.

**Solution** :
- ✅ Ajout de Joi pour validation
- ✅ Schémas de validation pour auth, transactions, budgets
- ✅ Validation automatique des emails, mots de passe, etc.
- ✅ Messages d'erreur clairs

**Nouveaux fichiers** :
- `backend/src/validators/authValidator.js`
- `backend/src/validators/transactionValidator.js`
- `backend/src/validators/budgetValidator.js`

### 6. Pas de rate limiting (MOYEN)
**Problème** : Vulnérable aux attaques par force brute.

**Solution** :
```javascript
// Rate limiting général
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Rate limiting pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});
```

### 7. Gestion des erreurs insuffisante (MOYEN)
**Problème** : Pas de middleware global, risque de leak d'informations.

**Solution** :
- ✅ Middleware global de gestion d'erreurs
- ✅ Gestion spécifique des erreurs Mongoose, JWT, CSRF
- ✅ Stack trace cachée en production
- ✅ Codes HTTP appropriés

### 8. Modèle User incomplet (FAIBLE)
**Problème** : Manque de champs importants, pas d'index.

**Solution** :
- ✅ Ajout de `emailVerified`, `lastLogin`, `resetPasswordToken`, etc.
- ✅ Index sur email, googleId, createdAt
- ✅ Validation stricte des champs
- ✅ Masquage automatique des champs sensibles (toJSON)
- ✅ Préférences utilisateur (devise, langue, notifications)

### 9. Docker-compose mal configuré (MOYEN)
**Problème** : PostgreSQL inutilisé, chemin backend incorrect.

**Solution** :
- ✅ Suppression de PostgreSQL
- ✅ Correction du chemin vers `./backend`
- ✅ Variables d'environnement via `.env`
- ✅ Health check ajouté

### 10. Améliorations du contrôleur d'authentification
**Solution** :
- ✅ Vérification du compte bloqué
- ✅ Mise à jour de `lastLogin`
- ✅ Gestion des comptes sans mot de passe (OAuth uniquement)
- ✅ Linking des comptes Google existants

## 🔐 Exigences de mot de passe

**Politique stricte appliquée** :
- Minimum 12 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (@$!%*?&)

## 🛡️ Recommandations pour la production

### Configuration obligatoire

1. **Variables d'environnement**
```env
NODE_ENV=production
JWT_SECRET=<32+ caractères aléatoires>
SESSION_SECRET=<32+ caractères aléatoires>
MONGO_URI=mongodb://user:password@host:27017/mybudget
FRONTEND_URL=https://votre-domaine.com
```

2. **MongoDB sécurisé**
```bash
# Créer un utilisateur MongoDB
use admin
db.createUser({
  user: "mybudget_user",
  pwd: "mot_de_passe_fort",
  roles: [{ role: "readWrite", db: "mybudget" }]
})
```

3. **HTTPS obligatoire**
- Utilisez nginx comme reverse proxy
- Certificat SSL (Let's Encrypt recommandé)
- Redirection HTTP → HTTPS

4. **Configuration nginx exemple**
```nginx
server {
    listen 443 ssl http2;
    server_name api.votre-domaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Mises à jour de sécurité**
```bash
# Audit des dépendances
npm audit

# Mise à jour automatique
npm update

# Vérification des vulnérabilités
npm audit fix
```

6. **Backups automatiques**
```bash
# Backup MongoDB quotidien
0 2 * * * mongodump --uri="mongodb://localhost:27017/mybudget" --out=/backups/$(date +\%Y\%m\%d)
```

## 📊 Checklist de déploiement

- [ ] Variables d'environnement configurées (pas de valeurs par défaut)
- [ ] NODE_ENV=production
- [ ] HTTPS activé
- [ ] MongoDB avec authentification
- [ ] Rate limiting activé
- [ ] CSRF protection activé
- [ ] Logs configurés
- [ ] Monitoring en place
- [ ] Backups automatiques
- [ ] Firewall configuré
- [ ] Mises à jour de sécurité appliquées

## 🚨 En cas de faille de sécurité

1. **Révoquer immédiatement** tous les tokens JWT
2. **Changer** les secrets (JWT_SECRET, SESSION_SECRET)
3. **Forcer** la reconnexion de tous les utilisateurs
4. **Analyser** les logs pour détecter une intrusion
5. **Notifier** les utilisateurs si nécessaire
6. **Corriger** la vulnérabilité
7. **Documenter** l'incident

## 📞 Contact sécurité

Pour reporter une vulnérabilité de sécurité, veuillez nous contacter en privé avant toute divulgation publique.

## 🔄 Prochaines étapes recommandées

1. **Tests de sécurité**
   - Audit de sécurité professionnel
   - Tests de pénétration
   - Scan automatique des vulnérabilités

2. **Améliorations futures**
   - Authentification à deux facteurs (2FA)
   - Vérification par email
   - Politique de rotation des mots de passe
   - Journalisation avancée des événements de sécurité
   - WAF (Web Application Firewall)

3. **Monitoring**
   - Logs centralisés (ELK, Datadog, etc.)
   - Alertes sur activités suspectes
   - Dashboard de sécurité

---

Dernière mise à jour : Octobre 2024

