import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  balance: { type: Number, default: 0 },
  overdraftLimit: { type: Number, default: 0 }, // Découvert autorisé en €
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model('Wallet', walletSchema);
