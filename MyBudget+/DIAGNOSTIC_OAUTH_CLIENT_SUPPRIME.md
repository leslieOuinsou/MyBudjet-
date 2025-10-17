# 🔍 Diagnostic : Client OAuth supprimé

## 📋 Causes possibles de suppression

### 1️⃣ Suppression manuelle par erreur
**Comment vérifier** :
- Allez sur https://console.cloud.google.com/apis/credentials
- Dans la liste des clients, regardez s'il y a une corbeille ou "Supprimé"
- Vérifiez l'historique des modifications

**Solution** : Recréer le client

---

### 2️⃣ Suppression par un autre utilisateur
**Comment vérifier** :
- Allez sur https://console.cloud.google.com/iam-admin/iam
- Vérifiez qui a accès au projet "MyBudjet-Auth"
- Regardez les rôles : Owner, Editor, etc.

**Si quelqu'un d'autre a supprimé** :
- Demandez-lui pourquoi
- Recréez le client
- Limitez l'accès si nécessaire

---

### 3️⃣ Violation des règles Google
**Comment vérifier** :

#### A. Politique de dénomination
- ❌ Le nom du client était-il inapproprié ?
- ❌ Contenait-il des caractères spéciaux ?

#### B. Configuration incorrecte
- ❌ Origines JavaScript incorrectes ?
- ❌ URI de redirection invalides ?
- ❌ Trop de modifications rapides ?

#### C. Usage non conforme
- ❌ Trop de requêtes (rate limiting) ?
- ❌ Usage commercial sans autorisation ?

---

### 4️⃣ Problème de facturation
**Comment vérifier** :
- Allez sur https://console.cloud.google.com/billing
- Vérifiez que le projet a un compte de facturation actif
- Vérifiez les quotas et limites

---

### 5️⃣ Suspension du projet
**Comment vérifier** :
- Allez sur https://console.cloud.google.com/home/dashboard
- Regardez l'état du projet "MyBudjet-Auth"
- Vérifiez s'il y a des alertes ou suspensions

---

## 🔧 Étapes de vérification

### Étape 1 : Vérifier l'état du projet
1. Allez sur https://console.cloud.google.com/home/dashboard
2. Sélectionnez le projet "MyBudjet-Auth"
3. Regardez s'il y a des alertes rouges ou jaunes

### Étape 2 : Vérifier les identifiants
1. Allez sur https://console.cloud.google.com/apis/credentials
2. Regardez la liste des clients OAuth
3. Notez s'il y a des clients supprimés ou inactifs

### Étape 3 : Vérifier les permissions
1. Allez sur https://console.cloud.google.com/iam-admin/iam
2. Vérifiez qui a accès au projet
3. Regardez les rôles de chaque utilisateur

### Étape 4 : Vérifier l'historique
1. Allez sur https://console.cloud.google.com/home/activity
2. Regardez l'historique des 7 derniers jours
3. Cherchez les actions de suppression

### Étape 5 : Vérifier la facturation
1. Allez sur https://console.cloud.google.com/billing
2. Vérifiez que le projet est lié à un compte de facturation
3. Vérifiez les quotas

---

## 🚨 Signes d'alerte à rechercher

### Dans Google Console :
- ❌ Alertes rouges en haut de page
- ❌ Message "Projet suspendu"
- ❌ "Quota dépassé"
- ❌ "Compte de facturation requis"

### Dans les logs :
- ❌ "OAuth client was deleted"
- ❌ "Client not found"
- ❌ "Invalid client"

---

## 📞 Actions recommandées

### Immédiat :
1. **Vérifiez l'état du projet** (étape 1)
2. **Recréez le client OAuth** avec la même configuration
3. **Testez immédiatement** pour éviter une nouvelle suppression

### Court terme :
1. **Documentez la configuration** exacte
2. **Limitez l'accès** au projet
3. **Surveillez l'activité** quotidienne

### Long terme :
1. **Configurez des alertes** sur les suppressions
2. **Sauvegardez la configuration** dans un fichier
3. **Mettez en place un monitoring**

---

## 🔄 Configuration à recréer

Quand vous recréez le client, utilisez **exactement** cette configuration :

### Nom :
```
MyBudget Plus
```

### Type :
```
Application Web
```

### Origines JavaScript autorisées :
```
http://localhost:5173
http://localhost:3001
```

### URI de redirection autorisés :
```
http://localhost:3001/api/auth/google/callback
```

---

## 📊 Rapport de diagnostic

**Date** : $(Get-Date)
**Client supprimé** : 539732953225-hqirkbrt9mr4pelah2o43trups8fq9ep.apps.googleusercontent.com
**Projet** : MyBudjet-Auth

**Actions à effectuer** :
- [ ] Vérifier l'état du projet
- [ ] Vérifier les permissions utilisateur
- [ ] Vérifier la facturation
- [ ] Recréer le client OAuth
- [ ] Mettre à jour la configuration locale
- [ ] Tester la connexion

---

## 💡 Prévention future

1. **Ne partagez pas** l'accès au projet Google Console
2. **Documentez** toute modification
3. **Surveillez** l'activité du projet
4. **Sauvegardez** la configuration des clients
5. **Testez régulièrement** la connexion OAuth

---

**Consultez ce guide et dites-moi ce que vous trouvez !**
