import mongoose from 'mongoose';
import User from './src/models/user.js';
import { initializeDefaultData } from './src/utils/defaultData.js';

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mybudget';

async function addDefaultDataToExistingUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les utilisateurs
    const users = await User.find({});
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)`);

    let processed = 0;
    let success = 0;
    let errors = 0;

    for (const user of users) {
      try {
        console.log(`\n🔄 Traitement de l'utilisateur: ${user.name} (${user.email})`);
        
        const result = await initializeDefaultData(user._id);
        
        if (result.success) {
          console.log(`✅ Données ajoutées: ${result.categoriesCreated} catégories, ${result.walletsCreated} portefeuilles`);
          success++;
        } else {
          console.log(`⚠️ Aucune donnée ajoutée: ${result.message}`);
        }
        
        processed++;
        
      } catch (error) {
        console.error(`❌ Erreur pour ${user.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Utilisateurs traités: ${processed}`);
    console.log(`  - Succès: ${success}`);
    console.log(`  - Erreurs: ${errors}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
addDefaultDataToExistingUsers();
