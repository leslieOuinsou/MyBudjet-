import mongoose from 'mongoose';

const notificationPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  preferences: {
    budget: {
      type: Boolean,
      default: true
    },
    bill: {
      type: Boolean,
      default: true
    },
    security: {
      type: Boolean,
      default: true
    },
    update: {
      type: Boolean,
      default: true
    },
    marketing: {
      type: Boolean,
      default: false
    },
    weekly: {
      type: Boolean,
      default: true
    }
  },
  email: {
    enabled: {
      type: Boolean,
      default: true
    },
    budget: {
      type: Boolean,
      default: true
    },
    bill: {
      type: Boolean,
      default: true
    },
    security: {
      type: Boolean,
      default: true
    },
    weekly: {
      type: Boolean,
      default: true
    }
  },
  push: {
    enabled: {
      type: Boolean,
      default: true
    },
    budget: {
      type: Boolean,
      default: true
    },
    bill: {
      type: Boolean,
      default: true
    },
    security: {
      type: Boolean,
      default: true
    }
  },
  sms: {
    enabled: {
      type: Boolean,
      default: false
    },
    security: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour les préférences
notificationPreferencesSchema.methods.updatePreferences = function(newPreferences) {
  if (newPreferences.preferences) {
    this.preferences = { ...this.preferences, ...newPreferences.preferences };
  }
  if (newPreferences.email) {
    this.email = { ...this.email, ...newPreferences.email };
  }
  if (newPreferences.push) {
    this.push = { ...this.push, ...newPreferences.push };
  }
  if (newPreferences.sms) {
    this.sms = { ...this.sms, ...newPreferences.sms };
  }
  return this.save();
};

// Méthode statique pour obtenir ou créer les préférences
notificationPreferencesSchema.statics.getOrCreatePreferences = function(userId) {
  return this.findOneAndUpdate(
    { user: userId },
    {},
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export default mongoose.model('NotificationPreferences', notificationPreferencesSchema);
