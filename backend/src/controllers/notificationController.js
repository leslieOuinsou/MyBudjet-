import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';
import { emailNotificationIfEnabled } from '../utils/notificationGenerator.js';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  preferences: {
    budget: true,
    bill: true,
    security: true,
    update: true,
    marketing: false,
    weekly: true,
  },
  email: {
    enabled: true,
    budget: true,
    bill: true,
    security: true,
    weekly: true,
  },
  push: {
    enabled: true,
    budget: true,
    bill: true,
    security: true,
  },
  sms: {
    enabled: false,
    security: true,
  },
};

async function getOrCreateNotificationPreferences(uid) {
  let prefs = await prisma.notificationPreferences.findUnique({ where: { userId: uid } });
  if (!prefs) {
    prefs = await prisma.notificationPreferences.create({
      data: {
        userId: uid,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      },
    });
  }
  return prefs;
}

function mergeJson(current, incoming) {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  return { ...base, ...incoming };
}

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unread } = req.query;
    const uid = getUserId(req.user);

    const where = { userId: uid };
    if (type) where.type = type;
    if (unread === 'true') where.isRead = false;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: uid, isRead: false } }),
    ]);

    res.json({
      notifications: serialize(notifications),
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = getUserId(req.user);

    const existing = await prisma.notification.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(serialize(notification));
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const uid = getUserId(req.user);

    await prisma.notification.updateMany({
      where: { userId: uid, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const uid = getUserId(req.user);

    const existing = await prisma.notification.findFirst({
      where: { id, userId: uid },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const getNotificationPreferences = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const preferences = await getOrCreateNotificationPreferences(uid);
    res.json(serialize(preferences));
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const preferences = req.body;

    let userPreferences = await getOrCreateNotificationPreferences(uid);

    const updateData = {};
    if (preferences.preferences) {
      updateData.preferences = mergeJson(userPreferences.preferences, preferences.preferences);
    }
    if (preferences.email) {
      updateData.email = mergeJson(userPreferences.email, preferences.email);
    }
    if (preferences.push) {
      updateData.push = mergeJson(userPreferences.push, preferences.push);
    }
    if (preferences.sms) {
      updateData.sms = mergeJson(userPreferences.sms, preferences.sms);
    }

    if (Object.keys(updateData).length > 0) {
      userPreferences = await prisma.notificationPreferences.update({
        where: { userId: uid },
        data: updateData,
      });
    }

    res.json(serialize(userPreferences));
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { type, title, message, data, priority = 'medium' } = req.body;
    const uid = getUserId(req.user);

    const notification = await prisma.notification.create({
      data: {
        userId: uid,
        type,
        title,
        message,
        data: data || {},
        priority,
      },
    });

    await emailNotificationIfEnabled(uid, { title, message, priority, type });
    res.status(201).json(serialize(notification));
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
