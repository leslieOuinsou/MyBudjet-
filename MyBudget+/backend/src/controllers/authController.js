import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createWelcomeNotification } from '../utils/notificationGenerator.js';
import { initializeDefaultData, addMissingCategories, addMissingWallets } from '../utils/defaultData.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation du mot de passe (minimum 12 caractères)
  if (!password || password.length < 12) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 12 caractères' });
  }
  
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already in use' });
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  
  // Initialiser les données par défaut (catégories et portefeuilles)
  await initializeDefaultData(user._id);
  
  // Créer une notification de bienvenue
  await createWelcomeNotification(user._id, user.name);
  
  res.status(201).json({ message: 'User registered with default data initialized' });
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
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
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
