import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  color: String, // code couleur hexadécimal ou nom
  icon: String,  // nom d'icône ou URL
});

export default mongoose.model('Category', categorySchema);
