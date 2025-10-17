import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './src/models/notification.js';

// Charger les variables d'environnement
dotenv.config();

const createTestNotifications = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer l'utilisateur (vous devez être connecté)
    // Remplacez cet ID par votre vrai ID utilisateur
    const userId = '68ed24faf29407bc07a57525'; // VOTRE USER ID

    console.log('\n📝 Création de notifications de test...');

    // Supprimer les anciennes notifications de test
    await Notification.deleteMany({ user: userId, type: 'test' });

    // Créer 3 notifications de test
    const notifications = [
      {
        user: userId,
        type: 'budget_alert',
        title: 'Alerte budgétaire',
        message: 'Votre budget Alimentation a atteint 80%. Il vous reste 50€ pour ce mois.',
        priority: 'high',
        read: false,
        data: { budgetId: '123', category: 'Alimentation', percentage: 80 }
      },
      {
        user: userId,
        type: 'transaction_reminder',
        title: 'Nouvelle transaction',
        message: 'Transaction de 25€ ajoutée dans la catégorie Restaurant.',
        priority: 'medium',
        read: false,
        data: { transactionId: '456', amount: 25, category: 'Restaurant' }
      },
      {
        user: userId,
        type: 'goal_achieved',
        title: 'Objectif atteint !',
        message: 'Félicitations ! Vous avez atteint votre objectif d\'épargne de 500€.',
        priority: 'high',
        read: false,
        data: { goalId: '789', amount: 500 }
      }
    ];

    for (const notif of notifications) {
      await Notification.create(notif);
      console.log(`✅ Notification créée: ${notif.title}`);
    }

    console.log('\n✅ 3 notifications de test créées avec succès !');
    console.log('🔔 Rechargez votre application pour voir le badge rouge avec le chiffre "3"');
    
    await mongoose.connection.close();
    console.log('\n🔌 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createTestNotifications();

