import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
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
    
    // Configure nodemailer (exemple Gmail, à adapter)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Réinitialisation de mot de passe',
      html: `<p>Pour réinitialiser votre mot de passe, cliquez ici : <a href="${resetUrl}">${resetUrl}</a></p>`
    });
    
    console.log('✅ Email de réinitialisation envoyé à', user.email);
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
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(400).json({ message: 'Token invalide ou expiré' });
  }
};
