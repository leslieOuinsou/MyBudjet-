# ✅ LISTE DE VÉRIFICATION GOOGLE CONSOLE

## 🎯 Erreur : invalid_grant

Cette erreur signifie que Google refuse votre requête OAuth.
Cela vient TOUJOURS d'une mauvaise configuration dans Google Console.

---

## 📋 VÉRIFICATION ÉTAPE PAR ÉTAPE

### Étape 1 : Ouvrez Google Console
```
https://console.cloud.google.com/apis/credentials
```

### Étape 2 : Sélectionnez votre projet
En haut de la page, vérifiez que le projet sélectionné est bien : **MyBudjet-Auth**

### Étape 3 : Trouvez votre client OAuth
Dans la liste "ID client OAuth 2.0", trouvez :
```
539732953225-aub0s5hicftcjstshqsjq167i4180cns
```

### Étape 4 : CLIQUEZ sur ce client pour l'ouvrir

---

## 🔍 VÉRIFICATIONS CRITIQUES

Une fois le client ouvert, vérifiez **EXACTEMENT** :

### ✅ URI de redirection autorisés

**DOIT contenir EXACTEMENT cette ligne** :
```
http://localhost:3001/api/auth/google/callback
```

**VÉRIFICATIONS** :
- [ ] Commence par `http://` (PAS https://)
- [ ] Port est `3001` (PAS 3000, PAS 3002)
- [ ] Contient `/api/` (PAS seulement `/auth/`)
- [ ] Se termine par `callback` (PAS de slash final `/`)
- [ ] Pas d'espace avant ou après
- [ ] Exactement en minuscules

**SI CE N'EST PAS LE CAS** :
1. Cliquez sur "MODIFIER"
2. Supprimez toutes les URI incorrectes
3. Cliquez "+ AJOUTER UN URI"
4. Copiez-collez EXACTEMENT : `http://localhost:3001/api/auth/google/callback`
5. Cliquez "ENREGISTRER"

---

### ✅ Origines JavaScript autorisées

**DOIT contenir ces 2 lignes** :
```
http://localhost:5173
http://localhost:3001
```

**SI MANQUANT** :
1. Cliquez "+ AJOUTER UN URI"
2. Ajoutez : `http://localhost:5173`
3. Cliquez "+ AJOUTER UN URI" à nouveau
4. Ajoutez : `http://localhost:3001`
5. Cliquez "ENREGISTRER"

---

## 📸 CAPTURE D'ÉCRAN

Votre configuration devrait ressembler à :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identifiants pour les applications Web

Nom : MyBudget Plus
ID client : 539732953225-aub0s5hicftcjstshqsjq167i4180cns.apps...
Secret client : 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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Origines JavaScript autorisées

• http://localhost:5173
• http://localhost:3001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URI de redirection autorisés

• http://localhost:3001/api/auth/google/callback

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ ERREURS COURANTES

### ❌ URI incorrecte trouvée :
```
http://localhost:3000/auth/google/callback    ← Port 3000, manque /api/
http://localhost:3001/auth/google/callback    ← Manque /api/
http://localhost:3001/api/auth/google/callback/  ← Slash final
```

### ✅ URI correcte :
```
http://localhost:3001/api/auth/google/callback
```

---

## 🔧 Étape 5 : Écran de consentement

Allez sur : https://console.cloud.google.com/apis/credentials/consent

**Vérifiez** :
- [ ] État : "Test" (c'est OK)
- [ ] Utilisateurs test : `ouinsoul5@gmail.com` est ajouté
- [ ] Scopes : email, profile, openid sont configurés

**SI ouinsoul5@gmail.com N'EST PAS dans les utilisateurs test** :
1. Cliquez "MODIFIER L'APPLICATION"
2. Allez à la section "Utilisateurs test"
3. Cliquez "+ AJOUTER DES UTILISATEURS"
4. Ajoutez : `ouinsoul5@gmail.com`
5. Cliquez "ENREGISTRER"
6. Cliquez "ENREGISTRER ET CONTINUER" jusqu'à la fin

---

## ⏱️ Attendez après les modifications

**IMPORTANT** : Après avoir sauvegardé dans Google Console :
- Attendez **2 minutes complètes**
- Les modifications prennent du temps à se propager

---

## 🧪 TEST FINAL

Après avoir vérifié ET CORRIGÉ dans Google Console :

1. **Attendez 2 minutes**
2. **Ouvrez une fenêtre privée** : `Ctrl + Shift + N`
3. **Allez sur** : http://localhost:5173/login
4. **Cliquez** sur "Se connecter avec Google"
5. **Choisissez** votre compte
6. **Ça DOIT fonctionner**

---

## 📞 SI ÇA NE MARCHE TOUJOURS PAS

**Faites une capture d'écran** de votre page Google Console (celle avec les URI) et montrez-la moi.

Ou **copiez-collez** les URI que vous voyez dans :
- "URI de redirection autorisés"
- "Origines JavaScript autorisées"

---

## 💡 Alternative : Désactiver Google OAuth

Si vous ne voulez plus utiliser Google OAuth pour le moment :

1. Dans `backend/.env`, commentez les lignes Google :
```env
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_CALLBACK_URL=...
```

2. Redémarrez le backend
3. Utilisez l'authentification classique (email/password)

---

**La cause est 100% dans Google Console. Vérifiez point par point !** 🔍

