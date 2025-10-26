# 📧 Configuration de l'envoi d'emails

## **🎯 Configuration pour Gmail**

### **Étape 1 : Créer un App Password Gmail**

1. **Allez sur** : https://myaccount.google.com/security
2. **Activez la validation en 2 étapes** (si ce n'est pas déjà fait)
3. **Allez sur** : https://myaccount.google.com/apppasswords
4. **Créez un mot de passe d'application** :
   - Nom : `MyBudget+ Backend`
   - Copiez le mot de passe généré (16 caractères)

### **Étape 2 : Configurer les variables d'environnement**

Ajoutez ces lignes dans votre fichier `.env` du backend :

```env
# Configuration Email
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-app-password-16-caracteres
```

**Exemple :**
```env
EMAIL_USER=mybudget.app@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### **Étape 3 : Redémarrer le backend**

```bash
cd MyBudget+/backend
npm run dev
```

---

## **🔧 Configuration pour d'autres services**

### **Outlook / Hotmail**

```env
EMAIL_USER=votre-email@outlook.com
EMAIL_PASS=votre-mot-de-passe
```

Modifiez dans `emailService.js` :
```javascript
service: 'outlook'
```

### **Yahoo Mail**

```env
EMAIL_USER=votre-email@yahoo.com
EMAIL_PASS=votre-app-password
```

Modifiez dans `emailService.js` :
```javascript
service: 'yahoo'
```

### **Service SMTP personnalisé**

```env
EMAIL_HOST=smtp.exemple.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@exemple.com
EMAIL_PASS=votre-mot-de-passe
```

Modifiez dans `emailService.js` :
```javascript
return nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

---

## **🧪 Test de la configuration**

### **1. Tester l'envoi d'email**

Créez un script de test `backend/test-email.js` :

```javascript
import { sendPasswordResetEmail } from './src/utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('📧 Test envoi email...');
  
  const result = await sendPasswordResetEmail(
    'votre-email-test@gmail.com',
    'test-token-123456'
  );
  
  if (result.success) {
    console.log('✅ Email envoyé avec succès !');
  } else {
    console.error('❌ Échec envoi email:', result.error);
  }
}

testEmail();
```

Exécutez :
```bash
node backend/test-email.js
```

### **2. Tester via l'application**

1. Allez sur `/forgot-password`
2. Entrez votre email
3. Vérifiez votre boîte de réception (et spams)

---

## **⚠️ Problèmes courants**

### **Erreur : "Invalid login"**

- ✅ Vérifiez que vous utilisez un **App Password** (pas votre mot de passe Gmail)
- ✅ Vérifiez que la **validation en 2 étapes** est activée
- ✅ Vérifiez qu'il n'y a pas d'espaces dans le mot de passe dans `.env`

### **Erreur : "Missing credentials"**

- ✅ Vérifiez que `EMAIL_USER` et `EMAIL_PASS` sont dans le fichier `.env`
- ✅ Redémarrez le backend après modification du `.env`

### **Email non reçu**

- ✅ Vérifiez le dossier **spam**
- ✅ Vérifiez la console backend pour voir si l'email a été envoyé
- ✅ Attendez quelques minutes (délai de livraison)

### **Erreur : "Connection timeout"**

- ✅ Vérifiez votre connexion internet
- ✅ Vérifiez que le port 587 n'est pas bloqué par votre pare-feu
- ✅ Essayez avec le port 465 (secure: true)

---

## **🚀 En production (Vercel)**

### **Configuration Vercel**

1. Allez dans votre projet Vercel
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - `EMAIL_USER` : votre-email@gmail.com
   - `EMAIL_PASS` : votre-app-password
4. **Redéployez** votre application

---

## **📝 Mode développement sans email**

**Par défaut, sans configuration email :**
- ✅ Le token est affiché dans la console du backend
- ✅ Le lien de réinitialisation est loggé
- ✅ Vous pouvez copier-coller le lien directement

C'est **parfait pour le développement** ! 🎉

---

## **✨ Emails envoyés**

1. **Email de réinitialisation** (`forgotPassword`)
   - Lien de réinitialisation valide 1h
   - Design moderne avec bouton CTA
   - Instructions claires

2. **Email de confirmation** (après réinitialisation)
   - Confirmation du changement
   - Alerte sécurité si ce n'est pas l'utilisateur

---

## **📧 Personnalisation**

Pour personnaliser les emails, modifiez :
- `backend/src/utils/emailService.js`
- Templates HTML dans les fonctions `sendPasswordResetEmail` et `sendPasswordChangedEmail`

---

**Besoin d'aide ?** Contactez le support ! 😊
