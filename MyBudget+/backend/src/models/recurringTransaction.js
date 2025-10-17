import mongoose from 'mongoose';

const recurringTransactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: String,
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  nextDate: { type: Date, required: true },
  endDate: Date,
  attachment: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('RecurringTransaction', recurringTransactionSchema);
