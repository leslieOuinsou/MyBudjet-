import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

// Fonction utilitaire pour calculer les jours restants
function calculateDaysRemaining(period, startDate) {
  if (!startDate) return null;

  const now = new Date();
  const start = new Date(startDate);
  let endDate;

  switch (period) {
    case 'day':
      endDate = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'week':
      endDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      endDate = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      break;
    case 'year':
      endDate = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      break;
    default:
      return null;
  }

  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export const getBudgets = async (req, res) => {
  try {
    const uid = userId(req.user);
    const budgets = await prisma.budget.findMany({
      where: { userId: uid },
      include: { category: true, wallet: true },
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const now = new Date();
        let startDate = budget.startDate || now;
        let endDate;

        switch (budget.period) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week': {
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          }
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear() + 1, 0, 1);
            break;
          default:
            endDate = budget.endDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        const where = {
          userId: uid,
          type: 'expense',
          date: { gte: startDate, lt: endDate },
        };

        if (budget.categoryId) {
          where.categoryId = budget.categoryId;
        }

        const spentAgg = await prisma.transaction.aggregate({
          where,
          _sum: { amount: true },
        });
        const spent = spentAgg._sum.amount || 0;

        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const alertThreshold = budget.alertThreshold || 80;

        let status = 'good';
        let alertMessage = null;

        if (percentage >= 100) {
          status = 'exceeded';
          alertMessage = 'Budget dépassé !';
        } else if (percentage >= alertThreshold) {
          status = 'warning';
          alertMessage = `Attention: ${percentage.toFixed(1)}% du budget utilisé`;
        } else if (percentage >= 50) {
          status = 'half';
          alertMessage = `Plus de la moitié du budget utilisé (${percentage.toFixed(1)}%)`;
        }

        return {
          ...serialize(budget),
          spent: spent || 0,
          percentage: Math.round(percentage * 100) / 100,
          status,
          alertMessage,
          remaining: budget.amount - spent,
          daysRemaining: calculateDaysRemaining(budget.period, budget.startDate || new Date()),
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error) {
    console.error('❌ Erreur récupération budgets:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des budgets', error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { name, category, wallet, amount, period, startDate, endDate, alertThreshold } = req.body;
    console.log('📥 Création budget - données reçues:', { name, category, wallet, amount, period, startDate, endDate, alertThreshold });

    const periodMap = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
    const normalizedPeriod = periodMap[period] || period || 'month';

    const budget = await prisma.budget.create({
      data: {
        userId: userId(req.user),
        name,
        categoryId: category || null,
        walletId: wallet || null,
        amount: parseFloat(amount),
        period: normalizedPeriod,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        alertThreshold,
      },
      include: { category: true, wallet: true },
    });

    console.log('✅ Budget créé avec succès:', budget.id);
    res.status(201).json(serialize(budget));
  } catch (error) {
    console.error('❌ Erreur création budget:', error);
    res.status(500).json({ message: 'Erreur lors de la création du budget', error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { name, category, wallet, amount, period, startDate, endDate, alertThreshold } = req.body;
    console.log('📥 Modification budget - données reçues:', { name, category, wallet, amount, period, startDate, endDate, alertThreshold });

    const periodMap = { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
    const normalizedPeriod = period !== undefined ? (periodMap[period] || period) : undefined;

    const data = {
      name,
      categoryId: category !== undefined ? category || null : undefined,
      walletId: wallet !== undefined ? wallet || null : undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      period: normalizedPeriod,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
      alertThreshold,
    };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data,
      include: { category: true, wallet: true },
    });

    console.log('✅ Budget modifié avec succès:', budget.id);
    res.json(serialize(budget));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    console.error('❌ Erreur modification budget:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du budget', error: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    await prisma.budget.delete({ where: { id: req.params.id } });
    console.log('✅ Budget supprimé avec succès:', req.params.id);
    res.json({ message: 'Budget supprimé' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Budget not found' });
    }
    console.error('❌ Erreur suppression budget:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du budget', error: error.message });
  }
};
