import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/user.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mybudget';

async function makeUserAdmin() {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Demander l'email de l'utilisateur
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Usage: node make-admin.js <email>');
      console.log('   Exemple: node make-admin.js ouinsoul5@gmail.com');
      process.exit(1);
    }

    // Chercher l'utilisateur
    console.log(`🔍 Recherche de l'utilisateur: ${email}`);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ Utilisateur non trouvé: ${email}`);
      console.log('\n📋 Liste des utilisateurs disponibles:');
      const allUsers = await User.find({}, 'email name role');
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name}) - Rôle: ${u.role}`);
      });
      process.exit(1);
    }

    // Vérifier si déjà admin
    if (user.role === 'admin') {
      console.log(`✅ ${user.email} est déjà administrateur !`);
      console.log(`   Nom: ${user.name}`);
      console.log(`   Rôle: ${user.role}`);
      process.exit(0);
    }

    // Mettre à jour le rôle
    console.log(`🔄 Mise à jour du rôle de ${user.email}...`);
    user.role = 'admin';
    await user.save();

    console.log(`\n✅ ${user.email} est maintenant administrateur !`);
    console.log(`   Nom: ${user.name}`);
    console.log(`   Ancien rôle: user`);
    console.log(`   Nouveau rôle: ${user.role}`);
    console.log(`\n🎉 Vous pouvez maintenant accéder à la page admin !`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

makeUserAdmin();

