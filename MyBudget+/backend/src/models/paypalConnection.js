import mongoose from 'mongoose';

const paypalConnectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un seul compte PayPal par utilisateur
    },
    paypalUserId: {
      type: String,
      required: true,
    },
    paypalEmail: {
      type: String,
      required: false, // Pas toujours disponible avec scope openid seul
    },
    accessToken: {
      type: String,
      required: true,
      select: false, // Ne pas inclure par défaut pour la sécurité
    },
    refreshToken: {
      type: String,
      required: false, // Pas toujours disponible avec scope openid seul
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    lastSync: {
      type: Date,
      default: null,
    },
    accountInfo: {
      name: String,
      givenName: String,
      familyName: String,
      verified: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide
paypalConnectionSchema.index({ user: 1 });
paypalConnectionSchema.index({ paypalUserId: 1 });

// Méthode pour vérifier si le token est expiré
paypalConnectionSchema.methods.isTokenExpired = function () {
  return new Date() >= this.tokenExpiresAt;
};

const PayPalConnection = mongoose.model('PayPalConnection', paypalConnectionSchema);

export default PayPalConnection;

