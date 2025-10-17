# ⚠️ Vulnérabilités détectées - MyBudget+

## État actuel

Date d'audit : 14 octobre 2024

```
6 vulnérabilités détectées:
- 2 faible (low)
- 2 moyenne (moderate)  
- 2 élevée (high)
```

## 📋 Détails des vulnérabilités

### 1. cookie < 0.7.0 (Faible)
**Package** : `cookie`  
**Utilisé par** : `csurf`  
**Problème** : Accepte des caractères invalides dans le nom, chemin et domaine des cookies  
**CVE** : GHSA-pxg6-pf52-xh8x

**Solution** :
```bash
npm audit fix --force
# Note: Cela met à jour csurf vers 1.2.2 (breaking change)
```

**Recommandation** : 
- ✅ Appliquer la mise à jour
- Tester la protection CSRF après mise à jour

### 2. dompurify < 3.2.4 (Moyenne)
**Package** : `dompurify`  
**Utilisé par** : `jspdf`  
**Problème** : Permet Cross-site Scripting (XSS)  
**CVE** : GHSA-vhxf-7vqr-mrjg

**Solution** :
```bash
npm audit fix --force
# Note: Met à jour jspdf vers 3.0.3 (breaking change possible)
```

**Recommandation** :
- ✅ Appliquer la mise à jour
- Tester la génération de PDF après mise à jour
- Alternative : Utiliser une autre bibliothèque PDF (pdfkit, pdf-lib)

### 3. nodemailer < 7.0.7 (Moyenne)
**Package** : `nodemailer`  
**Version actuelle** : < 7.0.7  
**Problème** : Email peut être envoyé à un domaine non intentionnel  
**CVE** : GHSA-mm7p-fcc7-pg87

**Solution** :
```bash
npm install nodemailer@latest
```

**Recommandation** :
- ✅ **Appliquer immédiatement** (critique pour la sécurité email)
- Tester l'envoi d'emails de reset password après mise à jour

### 4. xlsx (Élevée)
**Package** : `xlsx`  
**Problèmes** :
1. Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
2. Regular Expression Denial of Service - ReDoS (GHSA-5pgg-2g8v-p4x9)

**Solution actuelle** : ⚠️ **Aucune correction disponible**

**Recommandations** :
1. **Court terme** : Continuer à utiliser avec précautions
   - Valider strictement les fichiers uploadés
   - Limiter la taille des fichiers
   - Traiter les fichiers dans un worker séparé
   
2. **Long terme** : Migrer vers une alternative
   - `exceljs` : Plus maintenu, plus sécurisé
   - `node-xlsx` : Alternative plus légère
   - `xlsx-populate` : API moderne

**Exemple de migration vers exceljs** :
```bash
npm uninstall xlsx
npm install exceljs
```

## 🔧 Plan d'action recommandé

### Immédiat (À faire maintenant)

1. **Mettre à jour nodemailer** (Critique)
```bash
cd backend
npm install nodemailer@latest
npm test  # Vérifier que tout fonctionne
```

2. **Appliquer les corrections disponibles**
```bash
npm audit fix --force
```

3. **Tester l'application**
- Authentification CSRF
- Génération de PDF
- Envoi d'emails

### Court terme (Cette semaine)

4. **Remplacer xlsx par exceljs**

Créer `backend/src/utils/excelHelper.js` :
```javascript
import ExcelJS from 'exceljs';

export async function createExcelFromTransactions(transactions) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');
  
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Montant', key: 'amount', width: 15 },
    { header: 'Type', key: 'type', width: 10 },
  ];
  
  transactions.forEach(t => {
    worksheet.addRow({
      date: new Date(t.date).toLocaleDateString(),
      description: t.description,
      amount: t.amount,
      type: t.type
    });
  });
  
  return await workbook.xlsx.writeBuffer();
}
```

Mettre à jour `backend/src/controllers/importExportController.js` pour utiliser exceljs.

### Long terme (Ce mois)

5. **Audit de sécurité complet**
   - Utiliser `npm audit` régulièrement
   - Mettre en place Dependabot sur GitHub
   - Scanner avec Snyk ou WhiteSource

6. **Tests de sécurité**
   - Tests unitaires pour validation
   - Tests d'intégration
   - Tests de pénétration

## 📊 Commandes utiles

### Audit complet
```bash
npm audit
npm audit --json > audit-report.json
```

### Voir les dépendances vulnérables
```bash
npm audit --parseable
```

### Mise à jour sélective
```bash
# Mettre à jour un package spécifique
npm update nodemailer

# Voir les versions disponibles
npm view nodemailer versions
```

### Vérifier les dépendances obsolètes
```bash
npm outdated
```

## 🛡️ Prévention future

### 1. Automatisation

Créer `.github/dependabot.yml` :
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 2. Hooks pre-commit

Installer `husky` :
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm audit"
```

### 3. CI/CD

Ajouter dans votre pipeline :
```yaml
- name: Security Audit
  run: npm audit --audit-level=moderate
```

## 📝 Suivi

### Statut des corrections

- [ ] nodemailer mis à jour vers 7.0.7+
- [ ] cookie mis à jour via csurf
- [ ] dompurify mis à jour via jspdf
- [ ] xlsx remplacé par exceljs
- [ ] Tests effectués après chaque mise à jour
- [ ] Documentation mise à jour

### Prochains audits

- **Hebdomadaire** : Vérification rapide avec `npm audit`
- **Mensuel** : Audit complet + mise à jour des dépendances
- **Trimestriel** : Audit de sécurité professionnel

## 🔗 Ressources

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Advisory Database](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

## ⚠️ Note importante

Ces vulnérabilités sont **dans les dépendances** et non dans votre code. Cependant, elles peuvent affecter la sécurité de votre application.

**Actions prioritaires** :
1. ✅ Mettre à jour nodemailer (MAINTENANT)
2. ✅ Appliquer npm audit fix (AUJOURD'HUI)
3. ⏰ Remplacer xlsx (CETTE SEMAINE)
4. 📅 Mettre en place surveillance automatique (CE MOIS)

---

Dernière mise à jour : 14 octobre 2024

