# 📧 Guide Rapide : Recevoir les Emails de Réinitialisation

## **🎯 3 Étapes Simples**

---

### **Étape 1️⃣ : Créer un App Password Gmail**

1. **Ouvrez ce lien** : https://myaccount.google.com/apppasswords
   
2. **Connectez-vous** avec votre compte Gmail (`ouinsoul5@gmail.com`)

3. **Si vous voyez "La validation en 2 étapes n'est pas activée"** :
   - Cliquez sur ce lien : https://myaccount.google.com/security
   - Activez la **"Validation en 2 étapes"**
   - Suivez les instructions (téléphone, SMS, etc.)
   - Retournez sur : https://myaccount.google.com/apppasswords

4. **Créez un mot de passe d'application** :
   - Cliquez sur **"Sélectionner l'application"** → **"Autre"**
   - Nom : `MyBudget Backend`
   - Cliquez sur **"Générer"**
   - **COPIEZ le mot de passe à 16 caractères** (exemple : `abcd efgh ijkl mnop`)

---

### **Étape 2️⃣ : Ajouter au fichier `.env`**

1. **Ouvrez le fichier** :
   ```
   MyBudget+/backend/.env
   ```

2. **Ajoutez ces deux lignes à la fin** :
   ```env
   # Configuration Email
   EMAIL_USER=ouinsoul5@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   ```
   
   ⚠️ **Remplacez** :
   - `ouinsoul5@gmail.com` par votre vrai email Gmail
   - `abcd efgh ijkl mnop` par le mot de passe d'application que vous avez copié

3. **Sauvegardez le fichier** (Ctrl + S)

---

### **Étape 3️⃣ : Redémarrer le backend**

1. **Dans le terminal du backend** :
   - Appuyez sur **Ctrl + C** pour arrêter le serveur
   
2. **Relancez le serveur** :
   ```bash
   npm run dev
   ```

3. **Vérifiez les logs** :
   - Vous devriez voir : `✅ Email configured` (ou plus de warning `⚠️ Variables EMAIL_USER et EMAIL_PASS non configurées`)

---

## **🧪 Tester l'envoi d'email**

1. **Allez sur** : `http://localhost:5173/forgot-password`

2. **Entrez votre email** : `ouinsoul5@gmail.com`

3. **Cliquez sur** "Envoyer le lien de réinitialisation"

4. **Vérifiez votre boîte de réception Gmail** 📬
   - Si vous ne voyez rien, **vérifiez les SPAMS** !
   - L'email vient de : `MyBudget+ <ouinsoul5@gmail.com>`
   - Sujet : "Réinitialisation de votre mot de passe - MyBudget+"

---

## **❌ Problèmes Courants**

### **"Invalid login" ou "Missing credentials"**

✅ **Solutions** :
- Vérifiez que vous utilisez un **App Password**, pas votre mot de passe Gmail
- Vérifiez qu'il n'y a **pas d'espaces** autour du mot de passe dans le `.env`
- Vérifiez que la **validation en 2 étapes** est activée

### **Email non reçu**

✅ **Solutions** :
- Vérifiez le dossier **SPAM** / **Courrier indésirable**
- Attendez 1-2 minutes (délai de livraison)
- Vérifiez les logs du backend pour voir si l'email a été envoyé
- Essayez avec un autre email Gmail

### **"Connection timeout"**

✅ **Solutions** :
- Vérifiez votre connexion internet
- Vérifiez que votre pare-feu ne bloque pas le port 587
- Attendez quelques minutes et réessayez

---

## **📝 Exemple de `.env` complet**

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/mybudget

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth (si utilisé)
GOOGLE_CLIENT_ID=votre-client-id
GOOGLE_CLIENT_SECRET=votre-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:5173

# Admin Code
ADMIN_CREATION_CODE=MYBUDGET-ADMIN-2025

# Email Configuration (NOUVEAU)
EMAIL_USER=ouinsoul5@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

---

## **🎉 Résultat Final**

Une fois configuré, vous recevrez de **beaux emails HTML** :

✅ **Email de réinitialisation** :
- Design moderne avec bouton d'action
- Lien valide 1 heure
- Instructions claires

✅ **Email de confirmation** :
- Confirmation du changement de mot de passe
- Alerte sécurité

---

## **🔒 Sécurité**

⚠️ **IMPORTANT** :
- Le mot de passe d'application doit rester **SECRET**
- Ne le partagez **JAMAIS**
- Ne le commitez **JAMAIS** sur GitHub (le `.env` est déjà dans `.gitignore`)
- Pour la production, utilisez les **variables d'environnement Vercel**

---

**Besoin d'aide ?** Dites-moi où vous êtes bloqué ! 😊
