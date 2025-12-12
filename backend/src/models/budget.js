import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['day', 'week', 'month', 'year'], default: 'month' },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  alertThreshold: { type: Number, default: 80, min: 0, max: 100 },
}, {
  timestamps: true
});

export default mongoose.model('Budget', budgetSchema);
