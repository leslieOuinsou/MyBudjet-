import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bankAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount' },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  note: String,
  notes: String,
  tags: [String],
  attachment: String, // URL ou nom de fichier pour la pièce jointe
  paypalData: {
    transactionId: String,
    status: String,
  },
});

export default mongoose.model('Transaction', transactionSchema);
