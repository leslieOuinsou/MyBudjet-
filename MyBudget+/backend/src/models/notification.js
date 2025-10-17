import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'budget', 
      'bill', 
      'security', 
      'update', 
      'transaction', 
      'marketing', 
      'weekly',
      'budget_alert',
      'budget_exceeded',
      'transaction_reminder',
      'goal_achieved',
      'system',
      'test'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour marquer comme lu
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

// Méthode statique pour créer une notification
notificationSchema.statics.createNotification = function(userId, type, title, message, data = {}) {
  return this.create({
    user: userId,
    type,
    title,
    message,
    data
  });
};

export default mongoose.model('Notification', notificationSchema);
