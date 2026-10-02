import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  const users = serialize(await prisma.user.findMany());
  res.json(users);
};

export const getUser = async (req, res) => {
  const user = serialize(await prisma.user.findUnique({ where: { id: req.params.id } }));
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = serialize(await prisma.user.create({
    data: { name, email, password: hashedPassword }
  }));
  res.status(201).json(user);
};

export const updateUser = async (req, res) => {
  const { name, email } = req.body;
  try {
    const user = serialize(await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email }
    }));
    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw error;
  }
};

export const deleteUser = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw error;
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId(req.user) } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...safeUser } = user;
    res.json(serialize(safeUser));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, photo } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  // Le schéma Prisma utilise profilePicture (équivalent de photo côté API)
  if (photo !== undefined) data.profilePicture = photo;

  try {
    const user = serialize(await prisma.user.update({
      where: { id: userId(req.user) },
      data
    }));
    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    throw error;
  }
};

export const exportMyData = async (req, res) => {
  const id = userId(req.user);
  const [transactions, categories, wallets, budgets, reminders, recurring] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: id } }),
    prisma.category.findMany({ where: { userId: id } }),
    prisma.wallet.findMany({ where: { userId: id } }),
    prisma.budget.findMany({ where: { userId: id } }),
    prisma.billReminder.findMany({ where: { userId: id } }),
    prisma.recurringTransaction.findMany({ where: { userId: id } })
  ]);
  res.json({
    user: req.user,
    transactions: serialize(transactions),
    categories: serialize(categories),
    wallets: serialize(wallets),
    budgets: serialize(budgets),
    reminders: serialize(reminders),
    recurring: serialize(recurring)
  });
};

export const deleteAccount = async (req, res) => {
  const id = userId(req.user);
  // Cascade Prisma + suppressions explicites pour parité avec l'ancien comportement
  await Promise.all([
    prisma.transaction.deleteMany({ where: { userId: id } }),
    prisma.category.deleteMany({ where: { userId: id } }),
    prisma.wallet.deleteMany({ where: { userId: id } }),
    prisma.budget.deleteMany({ where: { userId: id } }),
    prisma.billReminder.deleteMany({ where: { userId: id } }),
    prisma.recurringTransaction.deleteMany({ where: { userId: id } })
  ]);
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'Compte et toutes les données supprimés (RGPD)' });
};
