import mongoose from 'mongoose';

const resetTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 heure
    index: { expireAfterSeconds: 0 } // TTL automatique
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index composé pour optimiser les requêtes
resetTokenSchema.index({ user: 1, used: 1 });
resetTokenSchema.index({ token: 1, used: 1 });

export default mongoose.model('ResetToken', resetTokenSchema);
