# 🔧 Guide de Correction - Erreurs 404 Routes Reports

## 🎯 Problème Identifié
Les routes `/api/reports/*` retournent des erreurs 404, ce qui signifie que :
1. Le serveur backend n'est pas démarré, OU
2. Les routes reports ne sont pas correctement montées, OU  
3. Il manque des dépendances backend

## ✅ Solutions Étape par Étape

### 1. 📦 Installer les Dépendances Backend
```bash
cd backend
npm install
npm install pdfkit
```

### 2. 🚀 Démarrer le Serveur Backend
```bash
cd backend
npm start
```

Le serveur devrait afficher :
```
✅ Routes configurées:
   - /api/reports/stats
   - /api/reports/categories
   - /api/reports/top-transactions
   - /api/health (test)
Server running on port 5000
```

### 3. 🧪 Tester la Configuration
Ouvrir dans le navigateur ou Postman :
- `http://localhost:5000/api/health` → devrait retourner `{"message": "Server is running"}`
- `http://localhost:5000/api/reports/test` → devrait retourner `{"message": "Reports router is working!"}`

### 4. 🔍 Diagnostic Automatique
Exécuter le script de diagnostic :
```powershell
.\diagnostic_backend.ps1
```

## 🛠️ Corrections Appliquées

### Backend Routes & Controller
✅ **Créé** : `backend/src/routes/reports.js`
✅ **Créé** : `backend/src/controllers/reportsController.js`  
✅ **Ajouté** : Route reports dans `backend/src/index.js`
✅ **Ajouté** : Routes de test et logs de diagnostic

### Dépendances
✅ **Ajouté** : `pdfkit` au package.json
✅ **Configuré** : Export CSV avec `json2csv`
✅ **Configuré** : Export PDF avec `pdfkit`

### Frontend API Calls  
✅ **Créé** : Fonctions API dans `apps/web/src/api.js`
✅ **Intégré** : Page Reports avec appels backend temps réel
✅ **Configuré** : Gestion d'erreurs et états de chargement

## 🚨 Vérifications Importantes

### 1. Vérifier que MongoDB fonctionne
```bash
# MongoDB doit être accessible sur mongodb://localhost:27017
mongo --eval "db.adminCommand('ismaster')"
```

### 2. Vérifier les variables d'environnement
Créer `backend/.env` si nécessaire :
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/mybudget
JWT_SECRET=mybudgetjwtsecret
```

### 3. Vérifier les ports
- Backend : Port 5000
- Frontend : Port 5173 (Vite dev server)
- Pas de conflit de ports

## 🎯 Test Final

### Après avoir démarré le backend, tester dans la console navigateur :
```javascript
// Doit fonctionner depuis http://localhost:5173
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
  
fetch('http://localhost:5000/api/reports/test') 
  .then(r => r.json())
  .then(console.log)
```

### Si les tests passent :
1. La page Reports devrait maintenant fonctionner
2. Les statistiques se chargeront depuis MongoDB
3. L'export CSV/PDF sera disponible

## 🔄 Si le Problème Persiste

### Option 1: Redémarrage complet
```bash
# Arrêter tous les serveurs
# Puis redémarrer dans l'ordre :
cd backend && npm start
# Dans un autre terminal :
cd apps/web && npm run dev
```

### Option 2: Vérifier les logs
Regarder les logs du serveur backend pour identifier les erreurs de démarrage.

### Option 3: Backend alternatif simple
Si le problème persiste, utiliser temporairement des données statiques dans le frontend en attendant de résoudre le problème backend.

---

## 🎉 Résultat Attendu

Après ces corrections :
- ✅ Routes `/api/reports/*` accessibles  
- ✅ Page Reports avec données temps réel
- ✅ Export CSV/PDF fonctionnel
- ✅ Statistiques calculées depuis MongoDB
- ✅ Interface utilisateur complètement opérationnelle
