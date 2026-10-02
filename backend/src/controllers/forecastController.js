import prisma from '../lib/prisma.js';
import { userId as getUserId } from '../lib/serialize.js';

// Calcul du solde projeté
export const getProjectedBalance = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { months = 1 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId: uid },
      select: { type: true, amount: true },
    });
    const currentBalance = transactions.reduce((balance, transaction) => {
      return transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: threeMonthsAgo },
      },
      select: { type: true, amount: true },
    });

    const monthlyIncome = recentTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 3;

    const monthlyExpenses = recentTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 3;

    const monthlyNet = monthlyIncome - monthlyExpenses;
    const projectedBalance = currentBalance + monthlyNet * parseInt(months, 10);

    res.json({
      currentBalance: Math.round(currentBalance * 100) / 100,
      projectedBalance: Math.round(projectedBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      monthlyNet: Math.round(monthlyNet * 100) / 100,
      projectionMonths: parseInt(months, 10),
    });
  } catch (error) {
    console.error('Erreur calcul solde projeté:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du solde projeté' });
  }
};

// Données pour le graphique de prévision
export const getForecastChart = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { months = 6 } = req.query;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: 'asc' },
      select: { type: true, amount: true, date: true },
    });

    const monthlyData = {};
    transactions.forEach((transaction) => {
      const monthKey = transaction.date.toISOString().substring(0, 7);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, balance: 0 };
      }

      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    let currentBalance = 0;
    const historicalData = Object.keys(monthlyData).map((month) => {
      const data = monthlyData[month];
      data.balance = data.income - data.expenses;
      currentBalance += data.balance;

      return {
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        balance: Math.round(data.balance * 100) / 100,
        cumulativeBalance: Math.round(currentBalance * 100) / 100,
      };
    });

    const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length || 0;
    const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length || 0;
    const avgBalance = avgIncome - avgExpenses;

    const projections = [];
    let lastBalance = currentBalance;
    const currentDate = new Date();

    for (let i = 1; i <= parseInt(months, 10); i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthKey = futureDate.toISOString().substring(0, 7);

      lastBalance += avgBalance;

      projections.push({
        month: monthKey,
        income: Math.round(avgIncome * 100) / 100,
        expenses: Math.round(avgExpenses * 100) / 100,
        balance: Math.round(avgBalance * 100) / 100,
        cumulativeBalance: Math.round(lastBalance * 100) / 100,
        isProjection: true,
      });
    }

    res.json({
      historical: historicalData,
      projections,
      summary: {
        avgMonthlyIncome: Math.round(avgIncome * 100) / 100,
        avgMonthlyExpenses: Math.round(avgExpenses * 100) / 100,
        avgMonthlyBalance: Math.round(avgBalance * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Erreur données graphique:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du graphique' });
  }
};

// Conseils personnalisés basés sur les données utilisateur
export const getPersonalizedAdvice = async (req, res) => {
  try {
    const uid = getUserId(req.user);

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: lastMonth },
      },
      include: { category: true },
    });

    const categorySpending = {};
    recentTransactions.forEach((transaction) => {
      if (transaction.type === 'expense' && transaction.category) {
        const categoryName = transaction.category.name;
        categorySpending[categoryName] = (categorySpending[categoryName] || 0) + transaction.amount;
      }
    });

    const budgets = await prisma.budget.findMany({
      where: { userId: uid },
      include: { category: true },
    });
    const budgetMap = {};
    budgets.forEach((budget) => {
      if (budget.category) {
        budgetMap[budget.category.name] = budget.amount;
      }
    });

    const advice = [];

    Object.keys(categorySpending).forEach((category) => {
      const spent = categorySpending[category];
      const budget = budgetMap[category];

      if (budget && spent > budget * 1.1) {
        const overspend = spent - budget;
        advice.push({
          type: 'warning',
          title: `Budget ${category} dépassé`,
          description: `Vous avez dépensé ${overspend.toFixed(2)}€ de plus que prévu en ${category}. Essayez de réduire ces dépenses le mois prochain.`,
          priority: 'high',
          category,
          amount: overspend,
        });
      }
    });

    const totalIncome = recentTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    if (savingsRate < 20 && savingsRate > 0) {
      advice.push({
        type: 'suggestion',
        title: 'Augmentez votre épargne',
        description: `Votre taux d'épargne est de ${savingsRate.toFixed(1)}%. Essayez d'atteindre 20% en réduisant les dépenses non essentielles.`,
        priority: 'medium',
        currentRate: savingsRate,
        targetRate: 20,
      });
    }

    const topCategories = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (topCategories.length > 0) {
      const [topCategory, topAmount] = topCategories[0];
      const percentOfTotal = totalExpenses > 0 ? (topAmount / totalExpenses) * 100 : 0;

      if (percentOfTotal > 30) {
        advice.push({
          type: 'info',
          title: `Optimisez vos dépenses en ${topCategory}`,
          description: `${percentOfTotal.toFixed(1)}% de vos dépenses vont vers ${topCategory}. Cherchez des alternatives pour réduire ces coûts.`,
          priority: 'medium',
          category: topCategory,
          percentage: percentOfTotal,
        });
      }
    }

    const incomeTransactions = recentTransactions.filter((t) => t.type === 'income');
    if (incomeTransactions.length < 2) {
      advice.push({
        type: 'suggestion',
        title: 'Diversifiez vos sources de revenus',
        description: 'Avoir plusieurs sources de revenus peut améliorer votre stabilité financière. Considérez le freelance ou les investissements.',
        priority: 'low',
      });
    }

    const recurringExpenses = recentTransactions
      .filter((t) => t.type === 'expense')
      .filter((t) => t.note && t.note.toLowerCase().includes('abonnement'));

    if (recurringExpenses.length > 3) {
      const totalRecurring = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);
      advice.push({
        type: 'warning',
        title: 'Révisez vos abonnements',
        description: `Vous avez ${recurringExpenses.length} abonnements pour ${totalRecurring.toFixed(2)}€. Vérifiez si tous sont nécessaires.`,
        priority: 'medium',
        count: recurringExpenses.length,
        amount: totalRecurring,
      });
    }

    if (advice.length === 0) {
      advice.push({
        type: 'success',
        title: 'Excellente gestion financière !',
        description: 'Vos finances semblent bien équilibrées. Continuez à suivre vos budgets et à épargner régulièrement.',
        priority: 'low',
      });
    }

    res.json({
      advice: advice.slice(0, 6),
      analysis: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
        topCategories: topCategories.map(([cat, amount]) => ({
          category: cat,
          amount: Math.round(amount * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur génération conseils:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des conseils' });
  }
};

// Vue d'ensemble des prévisions financières
export const getFinancialForecast = async (req, res) => {
  try {
    const uid = getUserId(req.user);

    const balanceData = await getProjectedBalanceData(uid);
    const savingsData = await getSavingsProjection(uid);
    const futureExpenses = await getFutureExpenses(uid);

    res.json({
      projectedBalance: balanceData.projectedBalance,
      estimatedSavings: savingsData.monthlyPotential,
      futureExpenses: futureExpenses.nextMonthTotal,
      trends: {
        balanceTrend: balanceData.trend,
        savingsTrend: savingsData.trend,
        expensesTrend: futureExpenses.trend,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur vue d'ensemble prévisions:", error);
    res.status(500).json({ message: "Erreur lors de la génération de la vue d'ensemble" });
  }
};

// Mise à jour des paramètres de prévision
export const updateForecastSettings = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const { savingsGoal, riskTolerance, planningHorizon } = req.body;

    const user = await prisma.user.findUnique({ where: { id: uid } });
    const currentPrefs = (user?.preferences && typeof user.preferences === 'object') ? user.preferences : {};

    await prisma.user.update({
      where: { id: uid },
      data: {
        preferences: {
          ...currentPrefs,
          forecastSettings: {
            savingsGoal: savingsGoal || 20,
            riskTolerance: riskTolerance || 'medium',
            planningHorizon: planningHorizon || 12,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    res.json({ message: 'Paramètres de prévision mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres' });
  }
};

async function getProjectedBalanceData(uid) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: uid },
    select: { type: true, amount: true },
  });
  const currentBalance = transactions.reduce((balance, transaction) => {
    return transaction.type === 'income'
      ? balance + transaction.amount
      : balance - transaction.amount;
  }, 0);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId: uid,
      date: { gte: threeMonthsAgo },
    },
    select: { type: true, amount: true },
  });

  const monthlyNet = recentTransactions.reduce((net, transaction) => {
    return transaction.type === 'income'
      ? net + transaction.amount / 3
      : net - transaction.amount / 3;
  }, 0);

  return {
    projectedBalance: currentBalance + monthlyNet,
    trend: monthlyNet > 0 ? 'positive' : 'negative',
  };
}

async function getSavingsProjection(uid) {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: uid,
      date: { gte: lastMonth },
    },
    select: { type: true, amount: true },
  });

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    monthlyPotential: Math.max(0, income - expenses),
    trend: income > expenses ? 'positive' : 'negative',
  };
}

async function getFutureExpenses(uid) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await prisma.transaction.findMany({
    where: {
      userId: uid,
      type: 'expense',
      date: { gte: threeMonthsAgo },
    },
    select: { amount: true },
  });

  const monthlyAverage = expenses.reduce((sum, t) => sum + t.amount, 0) / 3;

  return {
    nextMonthTotal: monthlyAverage,
    trend: 'stable',
  };
}
