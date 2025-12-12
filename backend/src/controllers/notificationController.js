import Notification from '../models/notification.js';
import NotificationPreferences from '../models/notificationPreferences.js';

// Récupérer toutes les notifications de l'utilisateur
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unread } = req.query;
    const userId = req.user._id;

    // Construire le filtre
    const filter = { user: userId };
    if (type) filter.type = type;
    if (unread === 'true') filter.isRead = false;

    // Calculer la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(filter)
    ]);

    // Compter les notifications non lues
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer une notification comme lue
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Marquer toutes les notifications comme lues
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les préférences de notification
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const preferences = await NotificationPreferences.getOrCreatePreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour les préférences de notification
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    const userPreferences = await NotificationPreferences.getOrCreatePreferences(userId);
    await userPreferences.updatePreferences(preferences);

    res.json(userPreferences);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer une nouvelle notification (pour les tests ou l'admin)
export const createNotification = async (req, res) => {
  try {
    const { type, title, message, data, priority = 'medium' } = req.body;
    const userId = req.user._id;

    const notification = await Notification.createNotification(
      userId,
      type,
      title,
      message,
      data
    );

    res.status(201).json(notification);
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
