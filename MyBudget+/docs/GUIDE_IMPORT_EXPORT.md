# Guide Import/Export MyBudget+

## Import de Données

### Formats Supportés
- **CSV** (recommandé)
- **Excel** (.xlsx, .xls)

### Structure des Fichiers

#### Fichier CSV
Le fichier CSV doit contenir les colonnes suivantes (l'ordre n'a pas d'importance) :

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `montant` ou `amount` | Montant de la transaction | 150.00 |
| `type` | Type de transaction | income, expense, revenu, depense |
| `note` ou `description` ou `libelle` | Description de la transaction | Salaire, Courses |
| `date` ou `date_transaction` | Date de la transaction | 2024-01-01 |

#### Format des Types
- **Revenus** : `income` ou `revenu`
- **Dépenses** : `expense` ou `depense`

#### Format des Montants
- Utiliser le point (.) comme séparateur décimal
- Les montants négatifs sont automatiquement convertis en dépenses
- Les montants positifs sont traités selon le type spécifié

#### Format des Dates
- Format recommandé : YYYY-MM-DD (2024-01-01)
- Autres formats acceptés : DD/MM/YYYY, MM/DD/YYYY

### Exemple de Fichier CSV
```csv
montant,type,note,date
150.00,income,Salaire,2024-01-01
-25.50,expense,Courses alimentaires,2024-01-02
-12.00,expense,Transport,2024-01-03
500.00,income,Prime,2024-01-05
```

### Gestion des Doublons
- Le système détecte automatiquement les doublons basés sur :
  - Le même montant
  - Le même type de transaction
  - La même date (±24 heures)
- Les doublons sont ignorés et comptabilisés dans le rapport d'import

### Limitations
- Taille maximale : 10 MB
- Les catégories et portefeuilles ne sont pas importés automatiquement
- Ils peuvent être assignés manuellement après l'import

## Export de Données

### Formats Disponibles
- **CSV** : Pour la réimportation ou l'analyse dans Excel
- **Excel** : Feuille de calcul formatée
- **PDF** : Rapport lisible et imprimable

### Filtres d'Export
- **Plage de dates** : Sélectionner une période spécifique
- **Transactions en attente** : Inclure ou exclure les transactions non confirmées

### Types d'Export

#### Export Transactions
Exporte la liste complète des transactions avec :
- Montant, Type, Catégorie, Portefeuille
- Date et note
- Formatage selon le format choisi

#### Rapport Financier (PDF uniquement)
Génère un rapport détaillé incluant :
- Résumé financier (revenus, dépenses, solde)
- Répartition par catégorie
- Solde par portefeuille
- Liste détaillée des transactions

## Conseils d'Utilisation

### Pour l'Import
1. **Préparez vos données** dans un format CSV simple
2. **Vérifiez les types** de transactions (income/expense)
3. **Utilisez des dates cohérentes** (YYYY-MM-DD recommandé)
4. **Testez avec un petit fichier** d'abord

### Pour l'Export
1. **Sélectionnez la période** qui vous intéresse
2. **Choisissez le bon format** selon votre usage :
   - CSV : pour Excel ou réimportation
   - Excel : pour analyses avancées
   - PDF : pour archivage ou impression
3. **Utilisez le rapport financier** pour des présentations

## Dépannage

### Erreurs d'Import Courantes
- **Montant invalide** : Vérifiez le format numérique (point décimal)
- **Type invalide** : Utilisez income/expense ou revenu/depense
- **Fichier trop volumineux** : Divisez en plusieurs fichiers < 10MB
- **Format non reconnu** : Vérifiez l'extension (.csv, .xlsx)

### Conseils de Performance
- Les gros imports peuvent prendre quelques minutes
- Évitez les fichiers avec plus de 1000 transactions
- Fermez les autres applications pendant l'import

## Support

En cas de problème :
1. Vérifiez le format de votre fichier
2. Consultez les messages d'erreur détaillés
3. Testez avec le fichier d'exemple fourni
4. Contactez le support technique si nécessaire
