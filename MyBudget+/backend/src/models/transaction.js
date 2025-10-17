import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  note: String,
  attachment: String, // URL ou nom de fichier pour la pièce jointe
});

export default mongoose.model('Transaction', transactionSchema);
