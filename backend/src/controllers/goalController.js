import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';
import { createGoalAchievedNotification } from '../utils/notificationGenerator.js';

function withProgress(goal) {
  const target = Number(goal.targetAmount) || 0;
  const current = Number(goal.currentAmount) || 0;
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(0, target - current);
  return {
    ...serialize(goal),
    percentage,
    remaining,
    achieved: target > 0 && current >= target,
  };
}

export const getGoals = async (req, res) => {
  try {
    const goals = await prisma.financialGoal.findMany({
      where: { userId: userId(req.user) },
      orderBy: { createdAt: 'asc' },
    });
    res.json(goals.map(withProgress));
  } catch (error) {
    console.error('❌ Erreur getGoals:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs', error: error.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, color } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Le nom de l\'objectif est requis' });
    }
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) {
      return res.status(400).json({ message: 'Le montant cible doit être supérieur à 0' });
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId: userId(req.user),
        name: String(name).trim(),
        targetAmount: target,
        currentAmount: Math.max(0, parseFloat(currentAmount) || 0),
        deadline: deadline ? new Date(deadline) : null,
        color: color || null,
      },
    });

    res.status(201).json(withProgress(goal));
  } catch (error) {
    console.error('❌ Erreur createGoal:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'objectif', error: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const uid = userId(req.user);
    const existing = await prisma.financialGoal.findFirst({
      where: { id: req.params.id, userId: uid },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }

    const { name, targetAmount, currentAmount, deadline, color } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (targetAmount !== undefined) {
      const target = parseFloat(targetAmount);
      if (!target || target <= 0) {
        return res.status(400).json({ message: 'Le montant cible doit être supérieur à 0' });
      }
      data.targetAmount = target;
    }
    if (currentAmount !== undefined) {
      data.currentAmount = Math.max(0, parseFloat(currentAmount) || 0);
    }
    if (deadline !== undefined) {
      data.deadline = deadline ? new Date(deadline) : null;
    }
    if (color !== undefined) data.color = color || null;

    const goal = await prisma.financialGoal.update({
      where: { id: req.params.id },
      data,
    });

    // L'objectif vient-il d'être atteint ? (passage sous la cible → cible atteinte)
    const wasAchieved = existing.currentAmount >= existing.targetAmount;
    const isNowAchieved = goal.currentAmount >= goal.targetAmount;
    if (!wasAchieved && isNowAchieved) {
      await createGoalAchievedNotification(uid, goal.name, goal.targetAmount);
    }

    res.json(withProgress(goal));
  } catch (error) {
    console.error('❌ Erreur updateGoal:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'objectif', error: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const result = await prisma.financialGoal.deleteMany({
      where: { id: req.params.id, userId: userId(req.user) },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    res.json({ message: 'Objectif supprimé' });
  } catch (error) {
    console.error('❌ Erreur deleteGoal:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'objectif', error: error.message });
  }
};
