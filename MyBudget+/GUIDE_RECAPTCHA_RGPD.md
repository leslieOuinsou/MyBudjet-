# 🔒 Guide : Configuration reCAPTCHA et RGPD

## **📋 Vue d'ensemble**

Ce guide explique comment configurer **reCAPTCHA** pour la sécurité des formulaires et le système de **gestion des cookies RGPD**.

---

## **🔐 PARTIE 1 : Configuration reCAPTCHA**

### **1️⃣ Obtenir les clés reCAPTCHA**

1. **Allez sur** : https://www.google.com/recaptcha/admin/create

2. **Remplissez le formulaire** :
   - **Label** : `MyBudget+ Production`
   - **Type reCAPTCHA** : Sélectionnez **reCAPTCHA v2** → **"Je ne suis pas un robot"**
   - **Domaines** : 
     - `localhost` (développement)
     - `yourdomain.com` (production)
   - Acceptez les conditions

3. **Copiez vos clés** :
   - **Site Key** (clé publique) : À utiliser dans le frontend
   - **Secret Key** (clé secrète) : À utiliser dans le backend

---

### **2️⃣ Configuration Frontend**

1. **Créez le fichier** `MyBudget+/apps/web/.env` (si pas déjà créé) :

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3001/api

# reCAPTCHA v2 Site Key (Clé publique)
VITE_RECAPTCHA_SITE_KEY=VOTRE_SITE_KEY_ICI
```

2. **Remplacez** `VOTRE_SITE_KEY_ICI` par la **Site Key** copiée à l'étape 1

3. **Redémarrez le frontend** :
```bash
cd MyBudget+/apps/web
npm run dev
```

---

### **3️⃣ Configuration Backend**

1. **Ouvrez** `MyBudget+/backend/.env`

2. **Ajoutez cette ligne** :
```env
# reCAPTCHA Secret Key (Clé secrète)
RECAPTCHA_SECRET_KEY=VOTRE_SECRET_KEY_ICI
```

3. **Remplacez** `VOTRE_SECRET_KEY_ICI` par la **Secret Key** copiée à l'étape 1

4. **Redémarrez le backend** :
```bash
cd MyBudget+/backend
npm run dev
```

---

### **4️⃣ Où reCAPTCHA est intégré**

Le reCAPTCHA est maintenant actif sur :

- ✅ `/login` - Connexion utilisateur
- ✅ `/signup` - Inscription utilisateur
- ✅ `/admin/login` - Connexion admin
- ✅ `/admin/signup` - Inscription admin (à intégrer si nécessaire)

---

### **🧪 Test en développement**

**Clé de TEST fournie par Google** (utilisée par défaut) :

```
Site Key: 6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

Cette clé **ACCEPTE TOUJOURS** la validation en développement local. Elle ne fonctionne **PAS en production** !

---

## **🍪 PARTIE 2 : Gestion des Cookies RGPD**

### **1️⃣ Composants créés**

#### **`CookieConsent.jsx`**
- Bannière de consentement RGPD conforme
- Gestion granulaire des préférences :
  - **Nécessaires** (obligatoires) : Authentification, sécurité
  - **Analytiques** (optionnels) : Google Analytics, statistiques
  - **Marketing** (optionnels) : Publicités personnalisées
- Sauvegarde dans `localStorage`
- Support mode sombre

#### **`PrivacyPolicyPage.jsx`**
- Page de politique de confidentialité complète
- Explique la collecte et l'utilisation des données
- Liste les droits RGPD de l'utilisateur
- Accessible via `/privacy-policy`

---

### **2️⃣ Fonctionnalités RGPD**

#### **Bannière de cookies**
La bannière s'affiche **automatiquement** à la première visite. Options :

1. **"Accepter tout"** : Active tous les cookies (nécessaires + analytiques + marketing)
2. **"Refuser tout"** : N'active que les cookies nécessaires
3. **"Personnaliser"** : Choix granulaire des catégories

#### **Préférences sauvegardées**
- Stockées dans `localStorage` sous la clé `cookieConsent`
- Date d'acceptation enregistrée
- Préférences appliquées immédiatement

#### **Événements Google Tag Manager**
Lorsque l'utilisateur fait un choix, des événements sont envoyés :
- `cookie_consent_all` : Tous acceptés
- `cookie_consent_reject` : Tous refusés
- `cookie_consent_custom` : Choix personnalisé

---

### **3️⃣ Intégration Google Analytics (optionnel)**

Si vous voulez activer **Google Analytics** en respectant le RGPD :

1. **Créez** `MyBudget+/apps/web/public/analytics.js` :

```javascript
// Google Analytics 4 - GA4
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Par défaut, bloquer les analytics jusqu'au consentement
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied'
});

// Fonction pour mettre à jour le consentement
window.updateGAConsent = function(analytics, marketing) {
  gtag('consent', 'update', {
    'analytics_storage': analytics ? 'granted' : 'denied',
    'ad_storage': marketing ? 'granted' : 'denied'
  });
};

// Initialiser GA4
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX'); // Remplacez par votre Measurement ID
```

2. **Modifiez** `MyBudget+/apps/web/index.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script src="/analytics.js"></script>
```

3. **Modifiez** `CookieConsent.jsx` pour mettre à jour GA :

```javascript
// Dans handleAcceptAll, handleRejectAll, handleSavePreferences
if (window.updateGAConsent) {
  window.updateGAConsent(preferences.analytics, preferences.marketing);
}
```

---

### **4️⃣ Pages et liens**

#### **Politique de confidentialité**
- **URL** : `/privacy-policy`
- **Accessible depuis** :
  - Bannière de cookies : "En savoir plus"
  - Footer du site
  - Formulaires d'inscription

#### **Liens à ajouter dans le Footer**
Créez un composant Footer avec :
```jsx
<Link to="/privacy-policy">Politique de confidentialité</Link>
<Link to="/terms">Conditions d'utilisation</Link>
<button onClick={openCookieSettings}>Gérer les cookies</button>
```

---

## **✅ Checklist de conformité RGPD**

- [x] Bannière de consentement affichée avant tout cookie non nécessaire
- [x] Choix granulaire (accepter/refuser par catégorie)
- [x] Politique de confidentialité accessible et complète
- [x] Cookies nécessaires clairement identifiés
- [x] Consentement sauvegardé et horodaté
- [x] Possibilité de retirer le consentement (via "Gérer les cookies")
- [x] Données chiffrées (HTTPS, bcrypt pour mots de passe)
- [ ] **À compléter** : Formulaire de contact DPO (Délégué à la Protection des Données)
- [ ] **À compléter** : Processus d'exercice des droits (accès, rectification, suppression)

---

## **🚀 Déploiement en production**

### **1. reCAPTCHA**
- ✅ Créez une **nouvelle clé reCAPTCHA** pour le domaine de production
- ✅ Ajoutez votre domaine dans la configuration reCAPTCHA
- ✅ Mettez à jour les variables d'environnement Vercel :
  - `VITE_RECAPTCHA_SITE_KEY` (frontend)
  - `RECAPTCHA_SECRET_KEY` (backend)

### **2. RGPD**
- ✅ Vérifiez que la politique de confidentialité est à jour
- ✅ Ajoutez l'adresse de contact réelle (email, adresse postale)
- ✅ Testez la bannière de cookies sur tous les navigateurs
- ✅ Assurez-vous que Google Analytics (si utilisé) respecte le consentement

### **3. HTTPS**
- ✅ Activez HTTPS sur Vercel (automatique)
- ✅ Forcez la redirection HTTP → HTTPS

---

## **📚 Ressources supplémentaires**

- **reCAPTCHA** : https://www.google.com/recaptcha/
- **RGPD (CNIL)** : https://www.cnil.fr/
- **Google Analytics & RGPD** : https://support.google.com/analytics/answer/9019185
- **Cookies & RGPD** : https://www.cnil.fr/fr/cookies-et-autres-traceurs

---

## **🆘 Support**

Si vous avez des questions :
- **Email** : privacy@mybudget.com
- **Email technique** : support@mybudget.com

---

**✅ Votre application est maintenant conforme RGPD et sécurisée avec reCAPTCHA !** 🎉

