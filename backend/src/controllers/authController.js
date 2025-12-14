import User from '../models/user.js';
import ResetToken from '../models/resetToken.js';
import Notification from '../models/notification.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createWelcomeNotification } from '../utils/notificationGenerator.js';
import { initializeDefaultData, addMissingCategories, addMissingWallets } from '../utils/defaultData.js';

export const register = async (req, res) => {
  try {
    console.log('🚀 ========== DÉBUT INSCRIPTION BACKEND ==========');
  const { name, email, password } = req.body;
    console.log('📋 Données reçues:', { name, email, passwordLength: password?.length });
  
  // Validation du mot de passe (minimum 12 caractères)
  if (!password || password.length < 12) {
      console.warn('⚠️ Validation échouée: Mot de passe trop court');
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères' });
  }
  
    console.log('🔍 Vérification si l\'email existe déjà...');
  const existing = await User.findOne({ email });
    if (existing) {
      console.warn('⚠️ Email déjà utilisé:', email);
      return res.status(400).json({ message: 'Email already in use' });
    }
    console.log('✅ Email disponible');
    
    console.log('🔐 Hashage du mot de passe...');
  const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Mot de passe hashé');
    
    console.log('👤 Création de l\'utilisateur...');
  const user = new User({ name, email, password: hashedPassword });
    console.log('📋 Utilisateur créé:', { name: user.name, email: user.email });
    
    console.log('💾 Sauvegarde dans MongoDB...');
  await user.save();
    console.log('✅ Utilisateur sauvegardé avec ID:', user._id);
  
    console.log('📊 Initialisation des données par défaut...');
    try {
  await initializeDefaultData(user._id);
      console.log('✅ Données par défaut initialisées');
    } catch (defaultDataError) {
      console.error('⚠️ Erreur lors de l\'initialisation des données par défaut:', defaultDataError);
      // Ne pas bloquer l'inscription si les données par défaut échouent
    }
  
    console.log('🔔 Création de la notification de bienvenue...');
    try {
  await createWelcomeNotification(user._id, user.name);
      console.log('✅ Notification créée');
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de la création de la notification:', notificationError);
      // Ne pas bloquer l'inscription si la notification échoue
    }
    
    console.log('✅ ========== INSCRIPTION RÉUSSIE ==========');
    console.log('📤 Envoi de la réponse 201...');
    res.status(201).json({ 
      message: 'User registered with default data initialized',
      success: true,
      userId: user._id
    });
  } catch (error) {
    console.error('❌ ========== ERREUR LORS DE L\'INSCRIPTION ==========');
    console.error('❌ Type d\'erreur:', error.constructor.name);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Erreur complète:', error);
    
    // Erreur MongoDB
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('📋 Erreur: Email déjà utilisé (duplicate key)');
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      console.error('📋 Erreur de validation Mongoose:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => ({ field: e.path, message: e.message }))
      });
    }
    
    // Erreur générique
    console.error('📋 Envoi de l\'erreur 500 au client');
    res.status(500).json({ 
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  
  if (user.blocked) {
    return res.status(403).json({ message: 'Account is blocked. Contact support.' });
  }
  
  if (!user.password) {
    return res.status(400).json({ message: 'Please use social login or reset your password' });
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ message: 'Invalid credentials' });
  
  // Vérifier si c'est la première connexion (pas de lastLogin ou créé récemment)
  const isFirstLogin = !user.lastLogin;
  const isNewUser = user.createdAt && (new Date() - new Date(user.createdAt)) < 24 * 60 * 60 * 1000; // Créé il y a moins de 24h
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  // Créer une notification de bienvenue si c'est la première connexion ou un nouvel utilisateur
  if (isFirstLogin || isNewUser) {
    try {
      // Vérifier s'il existe déjà une notification de bienvenue pour éviter les doublons
      const existingWelcome = await Notification.findOne({
        user: user._id,
        type: 'system',
        title: { $regex: /Bienvenue.*👋/i }
      });
      
      if (!existingWelcome) {
        await createWelcomeNotification(user._id, user.name);
        console.log(`👋 Notification de bienvenue créée lors de la première connexion pour ${user.name}`);
      }
    } catch (notificationError) {
      console.error('⚠️ Erreur lors de la création de la notification de bienvenue:', notificationError);
      // Ne pas bloquer la connexion si la notification échoue
    }
  }
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

export const googleCallback = async (req, res) => {
  try {
    // User is attached to req.user by passport
    if (!req.user) {
      console.error('❌ No user in Google callback');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    if (req.user.blocked) {
      console.error('❌ User blocked:', req.user.email);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=account_blocked`);
    }
    
    // Update last login
    req.user.lastLogin = new Date();
    await req.user.save();
    
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Google login successful for:', req.user.email);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }))}`);
  } catch (error) {
    console.error('❌ Error in Google callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};

// Fonction pour ajouter les données manquantes aux utilisateurs existants
export const addMissingDefaultData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Ajouter les catégories manquantes
    const categoriesResult = await addMissingCategories(userId);
    
    // Ajouter les portefeuilles manquants
    const walletsResult = await addMissingWallets(userId);
    
    res.json({
      success: true,
      message: 'Données par défaut ajoutées',
      details: {
        categories: categoriesResult,
        wallets: walletsResult
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données par défaut:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout des données par défaut',
      error: error.message 
    });
  }
};

// Inscription admin publique (avec code d'activation)
export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;
    
    console.log('🔐 Inscription admin publique:', { email, name });
    
    // Vérifier le code d'activation admin
    const ADMIN_CODE = process.env.ADMIN_CREATION_CODE || 'MYBUDGET-ADMIN-2025';
    
    if (adminCode !== ADMIN_CODE) {
      console.log('❌ Code admin invalide');
      return res.status(403).json({ 
        message: 'Code d\'activation admin invalide. Contactez le super-administrateur.' 
      });
    }
    
    // Validation du mot de passe (minimum 12 caractères pour admin)
    if (!password || password.length < 12) {
      return res.status(400).json({ 
        message: 'Le mot de passe admin doit contenir au moins 12 caractères' 
      });
    }
    
    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Créer l'utilisateur avec le rôle admin
    const newAdmin = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      emailVerified: true // Admin vérifié par défaut
    });
    
    await newAdmin.save();
    console.log('✅ Admin créé via inscription publique:', newAdmin._id);
    
    // Initialiser les données par défaut
    await initializeDefaultData(newAdmin._id);
    
    // Créer notification de bienvenue
    await createWelcomeNotification(newAdmin._id, newAdmin.name);
    
    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès. Vous pouvez maintenant vous connecter.',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur inscription admin:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte administrateur',
      error: error.message 
    });
  }
};

// Mot de passe oublié
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 Demande de réinitialisation:', { email });

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return res.status(200).json({ 
        message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.' 
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Supprimer les anciens tokens de cet utilisateur
    await ResetToken.deleteMany({ user: user._id });

    // Créer un nouveau token de réinitialisation
    const resetTokenDoc = new ResetToken({
      token: resetToken,
      user: user._id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 heure
    });

    await resetTokenDoc.save();

    // Envoyer l'email de réinitialisation (optionnel en développement)
    try {
      const { sendPasswordResetEmail } = await import('../utils/emailService.js');
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      
      if (!emailResult.success) {
        // En mode développement, on log le token
        console.log(`🔗 Token de réinitialisation pour ${email}: ${resetToken}`);
        console.log(`🔗 Lien: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`);
      }
    } catch (emailError) {
      // Si l'envoi d'email échoue, on continue quand même (mode développement)
      console.log(`🔗 Token de réinitialisation pour ${email}: ${resetToken}`);
      console.log(`🔗 Lien: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`);
    }

    res.status(200).json({ 
      message: 'Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.',
      // En développement seulement
      ...(process.env.NODE_ENV === 'development' && {
        resetToken: resetToken,
        resetLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`
      })
    });

  } catch (error) {
    console.error('❌ Erreur forgot password:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la demande de réinitialisation',
      error: error.message 
    });
  }
};

// Réinitialisation du mot de passe
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔐 Réinitialisation du mot de passe:', { token: token?.substring(0, 10) + '...' });

    // Validation du mot de passe
    if (!newPassword || newPassword.length < 12) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 12 caractères' 
      });
    }

    // Vérifier le token
    const resetTokenDoc = await ResetToken.findOne({ 
      token, 
      used: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!resetTokenDoc) {
      return res.status(400).json({ 
        message: 'Token invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.' 
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe de l'utilisateur
    await User.findByIdAndUpdate(resetTokenDoc.user._id, {
      password: hashedPassword
    });

    // Marquer le token comme utilisé
    resetTokenDoc.used = true;
    await resetTokenDoc.save();

    console.log(`✅ Mot de passe réinitialisé pour: ${resetTokenDoc.user.email}`);

    res.status(200).json({ 
      message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      user: {
        id: resetTokenDoc.user._id,
        email: resetTokenDoc.user.email,
        name: resetTokenDoc.user.name,
        role: resetTokenDoc.user.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur reset password:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message 
    });
  }
};
