import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['checking', 'savings', 'credit_card', 'investment', 'other'],
      default: 'checking',
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      // Les 4 derniers chiffres seulement pour la sécurité
    },
    accountNumberFull: {
      type: String,
      select: false, // Ne pas inclure par défaut dans les requêtes
      // Numéro complet chiffré (si nécessaire)
    },
    currency: {
      type: String,
      default: 'EUR',
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      default: '#1E73BE', // Couleur pour identifier visuellement le compte
    },
    icon: {
      type: String,
      default: '🏦', // Emoji ou icône pour le compte
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false, // Compte principal par défaut
    },
    // Informations de connexion bancaire (pour API bancaire future)
    bankConnection: {
      isConnected: {
        type: Boolean,
        default: false,
      },
      connectionId: {
        type: String,
        select: false,
      },
      lastSync: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide
bankAccountSchema.index({ user: 1, isActive: 1 });
bankAccountSchema.index({ user: 1, isPrimary: 1 });

// Méthode pour masquer le numéro de compte (afficher seulement les 4 derniers chiffres)
bankAccountSchema.methods.getMaskedAccountNumber = function () {
  if (this.accountNumber && this.accountNumber.length > 4) {
    const lastFour = this.accountNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  }
  return this.accountNumber;
};

// Méthode statique pour obtenir le compte principal d'un utilisateur
bankAccountSchema.statics.getPrimaryAccount = async function (userId) {
  return await this.findOne({ user: userId, isPrimary: true, isActive: true });
};

// Hook pre-save pour s'assurer qu'il n'y a qu'un seul compte principal
bankAccountSchema.pre('save', async function (next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Retirer le statut primary des autres comptes de cet utilisateur
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isPrimary: false } }
    );
  }
  next();
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

export default BankAccount;

