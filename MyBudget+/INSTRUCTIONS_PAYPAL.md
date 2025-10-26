# 🔧 Configuration PayPal - Instructions Détaillées

## 📝 Problème actuel
L'erreur "invalid client_id or redirect_uri" indique que l'URL de redirection n'est pas configurée dans votre application PayPal Developer.

## ✅ Solution 1 : Configurer l'URL dans votre application existante

1. **Allez sur** : https://developer.paypal.com/dashboard/applications/sandbox

2. **Connectez-vous** avec votre compte PayPal Developer

3. **Trouvez votre application** avec le Client ID :
   ```
   AdsnnuKnQzBrGtr2zX5NMXZMJFQS5RwJIHAPVlAZPjZllu3QuunYpLv4gZBdK-iKnHf2Yo4CikjVJygG
   ```

4. **Cliquez** sur le nom de l'application

5. **Cherchez** la section "Return URL" ou "Redirect URIs"

6. **Ajoutez** :
   ```
   http://localhost:3001/api/paypal/callback
   ```

7. **Sauvegardez**

---

## 🆕 Solution 2 : Créer une nouvelle application REST API

Si vous ne trouvez pas où configurer l'URL, créez une nouvelle application :

### Étapes :

1. **Allez sur** : https://developer.paypal.com/dashboard/applications/sandbox

2. **Cliquez sur** "Create App"

3. **Remplissez** :
   - **App Name** : MyBudget Plus
   - **App Type** : Merchant
   - **Sandbox Business Account** : Choisissez votre compte sandbox

4. **Cochez les permissions** :
   - ✅ Accept payments
   - ✅ Subscriptions
   - ✅ Transaction Search

5. **Dans "Return URL"**, mettez :
   ```
   http://localhost:3001/api/paypal/callback
   ```

6. **Cliquez** sur "Create App"

7. **Copiez** :
   - **Client ID** (commence par "A...")
   - **Secret** (cliquez sur "Show" pour le voir)

8. **Mettez-les** dans votre fichier `.env` :
   ```env
   PAYPAL_CLIENT_ID=Votre_Nouveau_Client_ID
   PAYPAL_CLIENT_SECRET=Votre_Nouveau_Secret
   ```

---

## 🧪 Tester la connexion

Après avoir configuré l'URL :

1. **Redémarrez** votre backend
2. **Allez sur** http://localhost:5173/transactions
3. **Cliquez** sur "Se connecter avec PayPal"
4. **Ça devrait fonctionner** ! ✅

---

## 🔍 Vérification

Pour vérifier que tout est correct, exécutez :

```bash
node check-paypal-config.js
```

Vous devriez voir :
- ✅ PAYPAL_CLIENT_ID configuré
- ✅ PAYPAL_CLIENT_SECRET configuré
- ✅ URL de redirection : http://localhost:3001/api/paypal/callback

---

## ❓ Si ça ne fonctionne toujours pas

Le problème peut être :

1. **L'URL n'est pas sauvegardée** dans PayPal Developer Dashboard
2. **Le Client ID est incorrect**
3. **Vous utilisez une application de type "Platform" au lieu de "Merchant"**
4. **Les permissions ne sont pas activées**

Dans ce cas, **créez une nouvelle application** (Solution 2) et assurez-vous de :
- Choisir le type "Merchant"
- Activer les permissions nécessaires
- Bien sauvegarder l'URL de redirection

---

## 📚 Documentation PayPal

- Dashboard : https://developer.paypal.com/dashboard/
- Documentation OAuth : https://developer.paypal.com/api/rest/authentication/
- Guide Connect with PayPal : https://developer.paypal.com/docs/log-in-with-paypal/

