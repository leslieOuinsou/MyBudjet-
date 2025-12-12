import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import Transaction from '../models/transaction.js';
import Category from '../models/category.js';
import Wallet from '../models/wallet.js';
import Budget from '../models/budget.js';
import BillReminder from '../models/billReminder.js';
import RecurringTransaction from '../models/recurringTransaction.js';

export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  res.status(201).json(user);
};

export const updateUser = async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, email }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ message: 'User deleted' });
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, photo } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, email, photo }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const exportMyData = async (req, res) => {
  const userId = req.user._id;
  const [transactions, categories, wallets, budgets, reminders, recurring] = await Promise.all([
    Transaction.find({ user: userId }),
    Category.find({ user: userId }),
    Wallet.find({ user: userId }),
    Budget.find({ user: userId }),
    BillReminder.find({ user: userId }),
    RecurringTransaction.find({ user: userId })
  ]);
  res.json({
    user: req.user,
    transactions,
    categories,
    wallets,
    budgets,
    reminders,
    recurring
  });
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  await Promise.all([
    Transaction.deleteMany({ user: userId }),
    Category.deleteMany({ user: userId }),
    Wallet.deleteMany({ user: userId }),
    Budget.deleteMany({ user: userId }),
    BillReminder.deleteMany({ user: userId }),
    RecurringTransaction.deleteMany({ user: userId })
  ]);
  await User.findByIdAndDelete(userId);
  res.json({ message: 'Compte et toutes les données supprimés (RGPD)' });
};
