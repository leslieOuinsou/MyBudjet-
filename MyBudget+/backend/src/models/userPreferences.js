import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'fr'
    },
    currency: {
      type: String,
      default: 'EUR'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'private'
    },
    dataSharing: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: true
    }
  },
  security: {
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['sms', 'email', 'app'],
        default: 'email'
      }
    },
    sessionTimeout: {
      type: Number,
      default: 30 // minutes
    },
    loginNotifications: {
      type: Boolean,
      default: true
    }
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly'],
      default: 'immediate'
    }
  },
  data: {
    autoBackup: {
      type: Boolean,
      default: true
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    dataRetention: {
      type: Number,
      default: 365 // days
    }
  }
}, {
  timestamps: true
});

// Méthode pour mettre à jour les préférences
userPreferencesSchema.methods.updatePreferences = function(category, newPreferences) {
  if (this[category]) {
    // Convertir en objet simple avant le merge
    const currentCategory = this[category].toObject ? this[category].toObject() : this[category];
    this[category] = { ...currentCategory, ...newPreferences };
    this.markModified(category);
  }
  return this.save();
};

// Méthode statique pour obtenir ou créer les préférences
userPreferencesSchema.statics.getOrCreatePreferences = function(userId) {
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

export default mongoose.model('UserPreferences', userPreferencesSchema);
