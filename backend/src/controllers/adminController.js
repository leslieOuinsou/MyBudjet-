import prisma from '../lib/prisma.js';
import { serialize } from '../lib/serialize.js';
import bcrypt from 'bcryptjs';
import { initializeDefaultData } from '../utils/defaultData.js';
import { createWelcomeNotification } from '../utils/notificationGenerator.js';

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      blocked: true,
      emailVerified: true,
      profilePicture: true,
      phoneNumber: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(serialize(users));
};

export const blockUser = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { blocked: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
      },
    });
    res.json(serialize(user));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw error;
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { blocked: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
      },
    });
    res.json(serialize(user));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw error;
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  // Cascade onDelete handles related data; explicit deletes kept for clarity/parity
  await Promise.all([
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.billReminder.deleteMany({ where: { userId } }),
    prisma.recurringTransaction.deleteMany({ where: { userId } }),
  ]);
  await prisma.user.delete({ where: { id: userId } });
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
      totalRevenueAgg,
      totalExpensesAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.budget.count(),
      prisma.billReminder.count(),
      prisma.recurringTransaction.count(),
      prisma.user.count({ where: { blocked: false } }),
      prisma.transaction.aggregate({
        where: { type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const stats = {
      userCount,
      txCount,
      budgetCount,
      reminderCount,
      recurringCount,
      activeUsers,
      blockedUsers: userCount - activeUsers,
      totalRevenue: totalRevenueAgg._sum.amount || 0,
      totalExpenses: totalExpensesAgg._sum.amount || 0,
      generatedAt: new Date().toISOString(),
    };

    console.log('✅ Statistiques générées:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur génération stats admin:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des statistiques' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        blocked: true,
      },
    });

    console.log(`✅ Rôle mis à jour pour ${user.email}: ${role}`);
    res.json({ message: 'Rôle mis à jour avec succès', user: serialize(user) });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.error('❌ Erreur mise à jour rôle:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rôle' });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const [transactionCount, budgetCount, reminderCount, totalIncomeAgg, totalExpensesAgg] = await Promise.all([
      prisma.transaction.count({ where: { userId: id } }),
      prisma.budget.count({ where: { userId: id } }),
      prisma.billReminder.count({ where: { userId: id } }),
      prisma.transaction.aggregate({
        where: { userId: id, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: id, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = totalIncomeAgg._sum.amount || 0;
    const totalExpenses = totalExpensesAgg._sum.amount || 0;

    res.json({
      transactionCount,
      budgetCount,
      reminderCount,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
    });
  } catch (error) {
    console.error('❌ Erreur stats utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques utilisateur' });
  }
};

export const getAllBillReminders = async (req, res) => {
  try {
    console.log('📋 Récupération de tous les rappels (admin)...');
    const reminders = await prisma.billReminder.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
        wallet: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    console.log(`✅ ${reminders.length} rappels trouvés`);
    res.json(serialize(reminders));
  } catch (error) {
    console.error('❌ Erreur récupération rappels:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rappels' });
  }
};

export const getAllRecurringTransactions = async (req, res) => {
  try {
    console.log('🔄 Récupération de toutes les transactions récurrentes (admin)...');
    const recurring = await prisma.recurringTransaction.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, icon: true, color: true } },
        wallet: { select: { id: true, name: true } },
      },
      orderBy: { nextDate: 'asc' },
    });

    console.log(`✅ ${recurring.length} transactions récurrentes trouvées`);
    res.json(serialize(recurring));
  } catch (error) {
    console.error('❌ Erreur récupération transactions récurrentes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions récurrentes' });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;

    console.log('🔐 Tentative de création admin:', { email, name });

    const ADMIN_CODE = process.env.ADMIN_CREATION_CODE || 'MYBUDGET-ADMIN-2025';

    if (adminCode !== ADMIN_CODE) {
      console.log('❌ Code admin invalide');
      return res.status(403).json({
        message: "Code d'activation admin invalide. Contactez le super-administrateur.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
      },
    });

    console.log('✅ Compte admin créé:', newAdmin.id);

    await initializeDefaultData(newAdmin.id);
    await createWelcomeNotification(newAdmin.id, newAdmin.name);

    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({
      message: 'Erreur lors de la création du compte administrateur',
      error: error.message,
    });
  }
};
