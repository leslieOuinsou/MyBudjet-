import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailService.js';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email, from } = req.body; // Récupérer le paramètre 'from' (admin ou user)
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Vérifier que les credentials email sont configurés
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('⚠️ Configuration email manquante (EMAIL_USER, EMAIL_PASS)');
      return res.status(503).json({ 
        message: 'Service email non configuré. Contactez l\'administrateur.' 
      });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'mybudgetjwtsecret', { expiresIn: '1h' });
    
    // Utiliser le service email centralisé avec le paramètre 'from'
    const emailResult = await sendPasswordResetEmail(user.email, token, from);
    
    if (!emailResult.success) {
      console.error('❌ Échec envoi email:', emailResult.reason || emailResult.error);
      return res.status(503).json({ 
        message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer plus tard.' 
      });
    }
    
    console.log(`✅ Email de réinitialisation envoyé à ${user.email} (origine: ${from || 'user'})`);
    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation:', err.message);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mybudgetjwtsecret');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Mettre à jour le mot de passe et récupérer l'utilisateur
    const user = await User.findByIdAndUpdate(
      decoded.id, 
      { password: hashedPassword },
      { new: true } // Retourner l'utilisateur mis à jour
    ).select('email role'); // Sélectionner uniquement les champs nécessaires
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    
    console.log(`✅ Mot de passe réinitialisé pour ${user.email} (rôle: ${user.role})`);
    
    // Envoyer un email de confirmation
    const confirmationResult = await sendPasswordChangedEmail(user.email, user.name || user.email);
    if (confirmationResult.success) {
      console.log(`✅ Email de confirmation envoyé à ${user.email}`);
    } else {
      console.warn(`⚠️ Échec envoi email de confirmation à ${user.email}:`, confirmationResult.reason || confirmationResult.error);
    }
    
    res.json({ 
      message: 'Mot de passe réinitialisé',
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', err.message);
    res.status(400).json({ message: 'Token invalide ou expiré' });
  }
};
