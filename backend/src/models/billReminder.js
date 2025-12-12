import mongoose from 'mongoose';

const billReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  note: String,
  reminded: { type: Boolean, default: false },
});

export default mongoose.model('BillReminder', billReminderSchema);
