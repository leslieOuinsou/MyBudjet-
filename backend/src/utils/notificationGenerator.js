import prisma from '../lib/prisma.js';

/**
 * Générateur de notifications automatiques
 */

// Créer une notification pour alerte budgétaire (80% atteint)
export const createBudgetAlertNotification = async (userId, budgetName, percentage, remaining) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'budget_alert',
        title: `Alerte budgétaire`,
        message: `Votre budget ${budgetName} a atteint ${percentage}%. Il vous reste ${remaining}€ pour ce mois.`,
        priority: 'high',
        data: {
          budgetName,
          percentage,
          remaining
        }
      }
    });
    console.log(`⚠️  Notification d'alerte budgétaire créée pour ${budgetName}`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Créer une notification pour budget dépassé
export const createBudgetExceededNotification = async (userId, budgetName, amount) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'budget_exceeded',
        title: `Budget dépassé !`,
        message: `Attention ! Votre budget ${budgetName} a été dépassé de ${amount}€.`,
        priority: 'high',
        data: {
          budgetName,
          exceeded: amount
        }
      }
    });
    console.log(`🚨 Notification de dépassement budgétaire créée pour ${budgetName}`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Créer une notification pour nouvelle transaction
export const createTransactionNotification = async (userId, amount, category, description) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'transaction_reminder',
        title: `Nouvelle transaction`,
        message: `Transaction de ${amount}€ ajoutée dans ${category}${description ? `: ${description}` : ''}.`,
        priority: 'medium',
        data: {
          amount,
          category,
          description
        }
      }
    });
    console.log(`💳 Notification de transaction créée: ${amount}€`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Créer une notification pour objectif atteint
export const createGoalAchievedNotification = async (userId, goalName, amount) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'goal_achieved',
        title: `Objectif atteint ! 🎉`,
        message: `Félicitations ! Vous avez atteint votre objectif "${goalName}" de ${amount}€.`,
        priority: 'high',
        data: {
          goalName,
          amount
        }
      }
    });
    console.log(`🎯 Notification d'objectif atteint créée: ${goalName}`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Créer une notification système
export const createSystemNotification = async (userId, title, message) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title,
        message,
        priority: 'medium'
      }
    });
    console.log(`ℹ️  Notification système créée`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Notification de bienvenue pour nouveaux utilisateurs
export const createWelcomeNotification = async (userId, userName) => {
  try {
    // Extraire le prénom si le nom complet contient un espace
    const firstName = userName ? userName.split(' ')[0] : 'Utilisateur';
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'system',
        title: `Bienvenue ${firstName} ! 👋`,
        message: `Bonjour ${firstName}, nous sommes ravis de vous accueillir sur MyBudget+ ! Commencez par créer votre premier budget et gérez vos finances en toute simplicité.`,
        priority: 'medium'
      }
    });
    console.log(`👋 Notification de bienvenue créée pour ${firstName}`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

// Notification hebdomadaire de résumé
export const createWeeklySummaryNotification = async (userId, totalSpent, totalIncome, savingsRate) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'weekly',
        title: `Résumé hebdomadaire 📊`,
        message: `Cette semaine : ${totalSpent}€ dépensés, ${totalIncome}€ de revenus. Taux d'épargne : ${savingsRate}%.`,
        priority: 'low',
        data: {
          totalSpent,
          totalIncome,
          savingsRate
        }
      }
    });
    console.log(`📊 Notification de résumé hebdomadaire créée`);
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
  }
};

export default {
  createBudgetAlertNotification,
  createBudgetExceededNotification,
  createTransactionNotification,
  createGoalAchievedNotification,
  createSystemNotification,
  createWelcomeNotification,
  createWeeklySummaryNotification
};
