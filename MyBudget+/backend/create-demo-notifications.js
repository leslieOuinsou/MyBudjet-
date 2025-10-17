import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  createBudgetAlertNotification,
  createBudgetExceededNotification,
  createTransactionNotification,
  createGoalAchievedNotification,
  createSystemNotification,
  createWelcomeNotification,
  createWeeklySummaryNotification
} from './src/utils/notificationGenerator.js';

// Charger les variables d'environnement
dotenv.config();

const createDemoNotifications = async () => {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // IMPORTANT : Remplacez cet ID par votre vrai ID utilisateur
    const userId = '68ed24faf29407bc07a57525'; // VOTRE USER ID

    console.log('📝 Création de notifications variées...\n');

    // 1. Notification de bienvenue
    await createWelcomeNotification(userId, 'Leslie');
    
    // 2. Alerte budgétaire (80%)
    await createBudgetAlertNotification(userId, 'Alimentation', 80, 50);
    
    // 3. Alerte budgétaire (90%)
    await createBudgetAlertNotification(userId, 'Loisirs', 90, 20);
    
    // 4. Budget dépassé
    await createBudgetExceededNotification(userId, 'Restaurant', 25);
    
    // 5. Nouvelle transaction
    await createTransactionNotification(userId, 45.50, 'Courses', 'Supermarché Carrefour');
    
    // 6. Nouvelle transaction
    await createTransactionNotification(userId, 12, 'Transport', 'Ticket de métro');
    
    // 7. Objectif atteint
    await createGoalAchievedNotification(userId, 'Vacances d\'été', 500);
    
    // 8. Résumé hebdomadaire
    await createWeeklySummaryNotification(userId, 234, 1500, 84);
    
    // 9. Notification système
    await createSystemNotification(
      userId, 
      'Nouvelle fonctionnalité disponible', 
      'Le mode sombre est maintenant disponible dans les paramètres !'
    );

    console.log('\n✅ 9 notifications créées avec succès !');
    console.log('🔔 Rechargez votre application pour voir le badge rouge avec le chiffre "9"');
    
    await mongoose.connection.close();
    console.log('\n🔌 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createDemoNotifications();

