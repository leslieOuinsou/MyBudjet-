# 🔐 Configuration PayPal pour accéder aux vraies données

## ✅ Étape 1 : Accéder au PayPal Developer Dashboard

1. **Allez sur** : https://developer.paypal.com/dashboard/applications/sandbox
2. **Connectez-vous** avec votre compte PayPal Developer
3. **Cliquez** sur votre application (celle avec le Client ID : `AdsnnuKnQzBrGtr2zX5NMXZMJFQS5RwJIHAPVlAZPjZllu3QuunYpLv4gZBdK-iKnHf2Yo4CikjVJygG`)

---

## ✅ Étape 2 : Configurer les Return URLs

Dans l'onglet **"App Settings"** :

1. Trouvez la section **"Return URL"** ou **"Redirect URIs"**
2. Ajoutez l'URL : `http://localhost:3001/api/paypal/callback`
3. **Sauvegardez**

---

## ✅ Étape 3 : Activer les Features nécessaires

Dans l'onglet **"Features"** :

### Activez ces fonctionnalités :

- ☑️ **Login with PayPal** (OpenID Connect)
- ☑️ **Transaction Search**
- ☑️ **Payment Capture**
- ☑️ **Advanced Credit and Debit Card Payments**

---

## ✅ Étape 4 : Configurer les Scopes OAuth

Dans l'onglet **"Live Credentials"** ou **"Sandbox Credentials"** :

### Vérifiez que ces scopes sont autorisés :

```
openid
profile
email
https://uri.paypal.com/services/payments/payment/authcapture
```

---

## ✅ Étape 5 : Créer un compte Sandbox Personnel (si pas encore fait)

1. Dans le Developer Dashboard, allez dans **"Sandbox" > "Accounts"**
2. **Créez un compte Personnel** (Personal Account)
3. Notez l'email et le mot de passe pour les tests

---

## 🧪 Test de la configuration

### Une fois configuré :

1. **Redémarrez le backend** : `npm run dev`
2. **Allez sur** : http://localhost:5173/transactions
3. **Cliquez** sur "Se connecter avec PayPal"
4. **Connectez-vous** avec votre **compte Sandbox Personnel**
5. **Autorisez** l'application

### Résultat attendu :

Si tout est bien configuré, vous devriez voir :
- ✅ Connexion réussie
- 💰 Solde de votre compte PayPal
- 📋 Vos vraies transactions PayPal (si vous en avez effectué des tests)

---

## ⚠️ Limitations du Sandbox

**Important** : Même avec les bons scopes, certaines APIs PayPal nécessitent :
- Un compte **Business vérifié**
- Des **permissions avancées** approuvées par PayPal
- Un **mode Production** (pas Sandbox)

### APIs nécessitant des permissions avancées :

- `/v1/reporting/balances` : Nécessite "Transaction Search" avancé
- `/v1/reporting/transactions` : Nécessite "Transaction Search" avancé

### Ce qui fonctionne en Sandbox standard :

- ✅ Authentification OAuth
- ✅ Informations de profil (email, nom)
- ✅ API Payments/Captures (paiements créés via votre app)
- ⚠️ Solde : Simulé (5000 EUR)
- ⚠️ Transactions : Simulées si aucune transaction de test

---

## 🔄 En Production (Live)

Pour accéder aux **vraies données en production** :

1. **Créez une application Live** (pas Sandbox)
2. **Soumettez une demande** pour les features avancées
3. **Fournissez** :
   - Description de votre application
   - Cas d'usage
   - Politique de confidentialité
   - Conditions d'utilisation
4. **Attendez l'approbation** de PayPal (quelques jours)

---

## 📝 Notes importantes

- **En Sandbox** : Les données sont limitées aux transactions de test
- **En Production** : Accès complet aux vraies données avec approbation
- **Sécurité** : Ne partagez jamais vos Client ID/Secret en production
- **Tokens** : Les access tokens expirent après 8 heures

---

## 🆘 Problèmes courants

### Erreur : "invalid scope"
➡️ Le scope n'est pas activé dans les Features de votre app

### Erreur : "NOT_AUTHORIZED" (403)
➡️ L'API nécessite des permissions avancées non disponibles en Sandbox standard

### Erreur : "invalid redirect_uri"
➡️ L'URL de callback n'est pas configurée dans les Return URLs

---

## ✅ État actuel de votre configuration

**Scopes configurés dans le code** :
```
openid
profile
email
https://uri.paypal.com/services/payments/payment/authcapture
```

**URL de callback** :
```
http://localhost:3001/api/paypal/callback
```

**Comportement actuel** :
- ✅ Connexion OAuth fonctionnelle
- 💰 Solde : 5000 EUR (simulé)
- 📋 Transactions : Simulées (Amazon, Client, Netflix)

**Pour voir vos vraies transactions** :
1. Activez les Features dans PayPal Developer
2. Effectuez des transactions de test avec votre compte Sandbox
3. Les vraies transactions s'afficheront (si l'API est accessible)

