import mongoose from 'mongoose';
import User from '../models/user.js';
import Transaction from '../models/transaction.js';
import Budget from '../models/budget.js';
import BillReminder from '../models/billReminder.js';
import RecurringTransaction from '../models/recurringTransaction.js';
import bcrypt from 'bcryptjs';
import { initializeDefaultData } from '../utils/defaultData.js';
import { createWelcomeNotification } from '../utils/notificationGenerator.js';

export const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const blockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const unblockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  await Promise.all([
    Transaction.deleteMany({ user: userId }),
    Budget.deleteMany({ user: userId }),
    BillReminder.deleteMany({ user: userId }),
    RecurringTransaction.deleteMany({ user: userId })
  ]);
  await User.findByIdAndDelete(userId);
  res.json({ message: 'Utilisateur et données supprimés' });
};

export const getStats = async (req, res) => {
  try {
    console.log('📊 Génération des statistiques admin...');
    
    const [
      userCount,
      txCount,
      budgetCount,
      reminderCount,
      recurringCount,
      activeUsers,
      totalRevenue,
      totalExpenses
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Budget.countDocuments(),
      BillReminder.countDocuments(),
      RecurringTransaction.countDocuments(),
      User.countDocuments({ blocked: false }),
      Transaction.aggregate([
        { $match: { type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    const stats = {
      userCount,
      txCount,
      budgetCount,
      reminderCount,
      recurringCount,
      activeUsers,
      blockedUsers: userCount - activeUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      generatedAt: new Date().toISOString()
    };
    
    console.log('✅ Statistiques générées:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur génération stats admin:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des statistiques' });
  }
};

// Mettre à jour le rôle d'un utilisateur
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ Rôle mis à jour pour ${user.email}: ${role}`);
    res.json({ message: 'Rôle mis à jour avec succès', user });
  } catch (error) {
    console.error('❌ Erreur mise à jour rôle:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle' });
  }
};

// Obtenir les statistiques détaillées d'un utilisateur
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [transactionCount, budgetCount, reminderCount, totalIncome, totalExpenses] = await Promise.all([
      Transaction.countDocuments({ user: id }),
      Budget.countDocuments({ user: id }),
      BillReminder.countDocuments({ user: id }),
      Transaction.aggregate([
        { $match: { user: mongoose.Types.ObjectId(id), type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: mongoose.Types.ObjectId(id), type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);
    
    res.json({
      transactionCount,
      budgetCount,
      reminderCount,
      totalIncome: totalIncome[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      balance: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0)
    });
  } catch (error) {
    console.error('❌ Erreur stats utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques utilisateur' });
  }
};

// Obtenir tous les rappels de factures (admin)
export const getAllBillReminders = async (req, res) => {
  try {
    console.log('📋 Récupération de tous les rappels (admin)...');
    const reminders = await BillReminder.find()
      .populate('user', 'name email')
      .populate('category', 'name icon color')
      .populate('wallet', 'name')
      .sort({ dueDate: 1 });
    
    console.log(`✅ ${reminders.length} rappels trouvés`);
    res.json(reminders);
  } catch (error) {
    console.error('❌ Erreur récupération rappels:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rappels' });
  }
};

// Obtenir toutes les transactions récurrentes (admin)
export const getAllRecurringTransactions = async (req, res) => {
  try {
    console.log('🔄 Récupération de toutes les transactions récurrentes (admin)...');
    const recurring = await RecurringTransaction.find()
      .populate('user', 'name email')
      .populate('category', 'name icon color')
      .populate('wallet', 'name')
      .sort({ nextDate: 1 });
    
    console.log(`✅ ${recurring.length} transactions récurrentes trouvées`);
    res.json(recurring);
  } catch (error) {
    console.error('❌ Erreur récupération transactions récurrentes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions récurrentes' });
  }
};

// Créer un nouveau compte administrateur (super-admin uniquement)
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;
    
    console.log('🔐 Tentative de création admin:', { email, name });
    
    // Vérifier le code d'activation admin (sécurité supplémentaire)
    const ADMIN_CODE = process.env.ADMIN_CREATION_CODE || 'MYBUDGET-ADMIN-2025';
    
    if (adminCode !== ADMIN_CODE) {
      console.log('❌ Code admin invalide');
      return res.status(403).json({ 
        message: 'Code d\'activation admin invalide. Contactez le super-administrateur.' 
      });
    }
    
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
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
    console.log('✅ Compte admin créé:', newAdmin._id);
    
    // Initialiser les données par défaut
    await initializeDefaultData(newAdmin._id);
    
    // Créer notification de bienvenue
    await createWelcomeNotification(newAdmin._id, newAdmin.name);
    
    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création du compte administrateur',
      error: error.message 
    });
  }
};
