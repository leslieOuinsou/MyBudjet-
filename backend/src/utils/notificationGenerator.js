import prisma from '../lib/prisma.js';
import { sendNotificationEmail } from './emailService.js';

/**
 * Générateur de notifications automatiques
 * Chaque fonction respecte les préférences de notification de l'utilisateur
 * (page /notifications) et inclut un anti-spam pour éviter les doublons.
 */

// Préférence associée à chaque type de notification (clé de preferences.preferences)
const PREFERENCE_KEYS = {
  budget_alert: 'budget',
  budget_exceeded: 'budget',
  bill: 'bill',
  system: 'update',
  weekly: 'weekly',
};

// Valeurs par défaut si l'utilisateur n'a jamais réglé ses préférences
const DEFAULT_PREFERENCES = {
  budget: true,
  bill: true,
  security: true,
  update: true,
  marketing: false,
  weekly: true,
};

/**
 * Vérifie si l'utilisateur a activé le type de notification donné.
 * Retourne true par défaut (sauf marketing).
 */
export const isNotificationAllowed = async (userId, type) => {
  try {
    const key = PREFERENCE_KEYS[type];
    if (!key) return true; // types sans réglage (bienvenue, objectif…) : toujours actifs

    const prefs = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });
    const value = prefs?.preferences?.[key];
    return value === undefined ? DEFAULT_PREFERENCES[key] : Boolean(value);
  } catch (error) {
    console.error('Erreur lecture préférences notification:', error);
    return true; // en cas de doute, ne pas bloquer la notification
  }
};

/**
 * Anti-spam : une notification identique (type + budgetName) existe-t-elle
 * déjà depuis moins de `hours` heures ?
 */
const hasRecentDuplicate = async (userId, type, budgetName, hours = 72) => {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type,
      createdAt: { gte: since },
      ...(budgetName ? { data: { path: ['budgetName'], equals: budgetName } } : {}),
    },
  });
  return Boolean(existing);
};

/**
 * Envoie aussi la notification par e-mail si l'utilisateur l'a activé
 * (Mon profil > Préférences > Notifications par e-mail, activé par défaut).
 * Ne lève jamais d'erreur : l'e-mail est un bonus, la notification existe déjà.
 */
export const emailNotificationIfEnabled = async (userId, { title, message, priority }) => {
  try {
    const [user, prefs] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
      prisma.userPreferences.findUnique({ where: { userId } }),
    ]);
    if (!user?.email || prefs?.notifications?.email === false) return false;
    const result = await sendNotificationEmail(user.email, user.name, { title, message, priority });
    return Boolean(result.success);
  } catch (error) {
    console.error('Erreur envoi e-mail de notification:', error.message);
    return false;
  }
};

/** Créer la notification si autorisée par les préférences et non redondante. */
const createIfAllowed = async ({ userId, type, title, message, priority, data, dedupeHours }) => {
  try {
    if (!(await isNotificationAllowed(userId, type))) return false;

    const budgetName = data?.budgetName;
    if (dedupeHours && (await hasRecentDuplicate(userId, type, budgetName, dedupeHours))) {
      return false;
    }

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        priority: priority || 'medium',
        data: data || {},
      },
    });
    await emailNotificationIfEnabled(userId, { title, message, priority });
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
    return false;
  }
};

// Créer une notification pour alerte budgétaire (80% atteint)
export const createBudgetAlertNotification = async (userId, budgetName, percentage, remaining) => {
  const created = await createIfAllowed({
    userId,
    type: 'budget_alert',
    title: `Alerte budgétaire`,
    message: `Votre budget ${budgetName} a atteint ${percentage}%. Il vous reste ${remaining}€ pour ce mois.`,
    priority: 'high',
    data: { budgetName, percentage, remaining },
    dedupeHours: 72, // max 1 alerte par budget tous les 3 jours
  });
  if (created) console.log(`⚠️  Notification d'alerte budgétaire créée pour ${budgetName}`);
  return created;
};

// Créer une notification pour budget dépassé
export const createBudgetExceededNotification = async (userId, budgetName, amount) => {
  const created = await createIfAllowed({
    userId,
    type: 'budget_exceeded',
    title: `Budget dépassé !`,
    message: `Attention ! Votre budget ${budgetName} a été dépassé de ${amount}€.`,
    priority: 'high',
    data: { budgetName, exceeded: amount },
    dedupeHours: 72,
  });
  if (created) console.log(`🚨 Notification de dépassement budgétaire créée pour ${budgetName}`);
  return created;
};

// Créer une notification de rappel de facture (échéance proche)
export const createBillReminderNotification = async (userId, billName, amount, dueDate) => {
  const due = new Date(dueDate).toLocaleDateString('fr-FR');
  const created = await createIfAllowed({
    userId,
    type: 'bill',
    title: `Facture à payer bientôt`,
    message: `La facture « ${billName} » de ${amount}€ est à payer avant le ${due}.`,
    priority: 'high',
    data: { billName, amount, dueDate },
  });
  if (created) console.log(`📄 Notification de rappel de facture créée pour ${billName}`);
  return created;
};

// Créer une notification pour objectif atteint
export const createGoalAchievedNotification = async (userId, goalName, amount) => {
  const created = await createIfAllowed({
    userId,
    type: 'goal_achieved',
    title: `Objectif atteint ! 🎉`,
    message: `Félicitations ! Vous avez atteint votre objectif "${goalName}" de ${amount}€.`,
    priority: 'high',
    data: { goalName, amount },
  });
  if (created) console.log(`🎯 Notification d'objectif atteint créée pour ${goalName}`);
  return created;
};

// Créer une notification système (mises à jour de l'application…)
export const createSystemNotification = async (userId, title, message) => {
  const created = await createIfAllowed({
    userId,
    type: 'system',
    title,
    message,
    priority: 'medium',
  });
  if (created) console.log(`ℹ️  Notification système créée`);
  return created;
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
        priority: 'medium',
      },
    });
    console.log(`👋 Notification de bienvenue créée pour ${firstName}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de notification:', error);
    return false;
  }
};

// Notification hebdomadaire de résumé (anti-doublon : une seule par semaine)
export const createWeeklySummaryNotification = async (userId, totalSpent, totalIncome, savingsRate) => {
  const created = await createIfAllowed({
    userId,
    type: 'weekly',
    title: `Résumé hebdomadaire 📊`,
    message: `Cette semaine : ${totalSpent}€ dépensés, ${totalIncome}€ de revenus. Taux d'épargne : ${savingsRate}%.`,
    priority: 'low',
    data: { totalSpent, totalIncome, savingsRate },
    dedupeHours: 24 * 6, // pas plus d'un résumé par semaine
  });
  if (created) console.log(`📊 Notification de résumé hebdomadaire créée`);
  return created;
};

export default {
  isNotificationAllowed,
  createBudgetAlertNotification,
  createBudgetExceededNotification,
  createBillReminderNotification,
  createGoalAchievedNotification,
  createSystemNotification,
  createWelcomeNotification,
  createWeeklySummaryNotification,
};
