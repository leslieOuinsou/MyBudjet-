import Transaction from '../models/transaction.js';
import Budget from '../models/budget.js';
import User from '../models/user.js';

// Calcul du solde projeté
export const getProjectedBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 1 } = req.query;
    
    // Calcul du solde actuel
    const transactions = await Transaction.find({ user: userId });
    const currentBalance = transactions.reduce((balance, transaction) => {
      return transaction.type === 'income' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, 0);

    // Calcul des moyennes mensuelles sur les 3 derniers mois
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = await Transaction.find({
      user: userId,
      date: { $gte: threeMonthsAgo }
    });

    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 3;
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 3;

    const monthlyNet = monthlyIncome - monthlyExpenses;
    const projectedBalance = currentBalance + (monthlyNet * parseInt(months));

    res.json({
      currentBalance: Math.round(currentBalance * 100) / 100,
      projectedBalance: Math.round(projectedBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      monthlyNet: Math.round(monthlyNet * 100) / 100,
      projectionMonths: parseInt(months)
    });
  } catch (error) {
    console.error('Erreur calcul solde projeté:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du solde projeté' });
  }
};

// Données pour le graphique de prévision
export const getForecastChart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { months = 6 } = req.query;
    
    // Calcul des moyennes mensuelles
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: sixMonthsAgo }
    }).sort({ date: 1 });

    // Grouper par mois
    const monthlyData = {};
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, balance: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    // Calculer les balances et moyennes
    let currentBalance = 0;
    const historicalData = Object.keys(monthlyData).map(month => {
      const data = monthlyData[month];
      data.balance = data.income - data.expenses;
      currentBalance += data.balance;
      
      return {
        month,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        balance: Math.round(data.balance * 100) / 100,
        cumulativeBalance: Math.round(currentBalance * 100) / 100
      };
    });

    // Calcul des moyennes pour projections
    const avgIncome = historicalData.reduce((sum, d) => sum + d.income, 0) / historicalData.length || 0;
    const avgExpenses = historicalData.reduce((sum, d) => sum + d.expenses, 0) / historicalData.length || 0;
    const avgBalance = avgIncome - avgExpenses;

    // Génération des projections futures
    const projections = [];
    let lastBalance = currentBalance;
    const currentDate = new Date();
    
    for (let i = 1; i <= parseInt(months); i++) {
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
        isProjection: true
      });
    }

    res.json({
      historical: historicalData,
      projections: projections,
      summary: {
        avgMonthlyIncome: Math.round(avgIncome * 100) / 100,
        avgMonthlyExpenses: Math.round(avgExpenses * 100) / 100,
        avgMonthlyBalance: Math.round(avgBalance * 100) / 100
      }
    });
  } catch (error) {
    console.error('Erreur données graphique:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du graphique' });
  }
};

// Conseils personnalisés basés sur les données utilisateur
export const getPersonalizedAdvice = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Analyse des transactions récentes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const recentTransactions = await Transaction.find({
      user: userId,
      date: { $gte: lastMonth }
    }).populate('category');

    // Analyse par catégories
    const categorySpending = {};
    recentTransactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category) {
        const categoryName = transaction.category.name;
        categorySpending[categoryName] = (categorySpending[categoryName] || 0) + transaction.amount;
      }
    });

    // Obtenir les budgets de l'utilisateur
    const budgets = await Budget.find({ user: userId }).populate('category');
    const budgetMap = {};
    budgets.forEach(budget => {
      if (budget.category) {
        budgetMap[budget.category.name] = budget.amount;
      }
    });

    // Génération des conseils
    const advice = [];

    // Conseil 1: Catégories avec dépassement de budget
    Object.keys(categorySpending).forEach(category => {
      const spent = categorySpending[category];
      const budget = budgetMap[category];
      
      if (budget && spent > budget * 1.1) { // 10% de tolérance
        const overspend = spent - budget;
        advice.push({
          type: 'warning',
          title: `Budget ${category} dépassé`,
          description: `Vous avez dépensé ${overspend.toFixed(2)}€ de plus que prévu en ${category}. Essayez de réduire ces dépenses le mois prochain.`,
          priority: 'high',
          category: category,
          amount: overspend
        });
      }
    });

    // Conseil 2: Épargne potentielle
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    if (savingsRate < 20 && savingsRate > 0) {
      advice.push({
        type: 'suggestion',
        title: 'Augmentez votre épargne',
        description: `Votre taux d'épargne est de ${savingsRate.toFixed(1)}%. Essayez d'atteindre 20% en réduisant les dépenses non essentielles.`,
        priority: 'medium',
        currentRate: savingsRate,
        targetRate: 20
      });
    }

    // Conseil 3: Top catégories de dépenses
    const topCategories = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)
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
          percentage: percentOfTotal
        });
      }
    }

    // Conseil 4: Régularité des revenus
    const incomeTransactions = recentTransactions.filter(t => t.type === 'income');
    if (incomeTransactions.length < 2) {
      advice.push({
        type: 'suggestion',
        title: 'Diversifiez vos sources de revenus',
        description: 'Avoir plusieurs sources de revenus peut améliorer votre stabilité financière. Considérez le freelance ou les investissements.',
        priority: 'low'
      });
    }

    // Conseil 5: Transactions récurrentes
    const recurringExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .filter(t => t.note && t.note.toLowerCase().includes('abonnement'));
    
    if (recurringExpenses.length > 3) {
      const totalRecurring = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);
      advice.push({
        type: 'warning',
        title: 'Révisez vos abonnements',
        description: `Vous avez ${recurringExpenses.length} abonnements pour ${totalRecurring.toFixed(2)}€. Vérifiez si tous sont nécessaires.`,
        priority: 'medium',
        count: recurringExpenses.length,
        amount: totalRecurring
      });
    }

    // Si aucun conseil spécifique, ajouter des conseils généraux
    if (advice.length === 0) {
      advice.push({
        type: 'success',
        title: 'Excellente gestion financière !',
        description: 'Vos finances semblent bien équilibrées. Continuez à suivre vos budgets et à épargner régulièrement.',
        priority: 'low'
      });
    }

    res.json({
      advice: advice.slice(0, 6), // Limiter à 6 conseils
      analysis: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
        topCategories: topCategories.map(([cat, amount]) => ({
          category: cat,
          amount: Math.round(amount * 100) / 100
        }))
      }
    });
  } catch (error) {
    console.error('Erreur génération conseils:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des conseils' });
  }
};

// Vue d'ensemble des prévisions financières
export const getFinancialForecast = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Obtenir les données de solde projeté
    const balanceData = await getProjectedBalanceData(userId);
    
    // Obtenir les données d'épargne
    const savingsData = await getSavingsProjection(userId);
    
    // Obtenir les dépenses futures prévues
    const futureExpenses = await getFutureExpenses(userId);

    res.json({
      projectedBalance: balanceData.projectedBalance,
      estimatedSavings: savingsData.monthlyPotential,
      futureExpenses: futureExpenses.nextMonthTotal,
      trends: {
        balanceTrend: balanceData.trend,
        savingsTrend: savingsData.trend,
        expensesTrend: futureExpenses.trend
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur vue d\'ensemble prévisions:', error);
    res.status(500).json({ message: 'Erreur lors de la génération de la vue d\'ensemble' });
  }
};

// Mise à jour des paramètres de prévision
export const updateForecastSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { savingsGoal, riskTolerance, planningHorizon } = req.body;
    
    await User.findByIdAndUpdate(userId, {
      $set: {
        'preferences.forecastSettings': {
          savingsGoal: savingsGoal || 20, // Pourcentage d'épargne souhaité
          riskTolerance: riskTolerance || 'medium', // low, medium, high
          planningHorizon: planningHorizon || 12, // Mois
          updatedAt: new Date()
        }
      }
    });

    res.json({ message: 'Paramètres de prévision mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des paramètres' });
  }
};

// Fonctions utilitaires internes
async function getProjectedBalanceData(userId) {
  const transactions = await Transaction.find({ user: userId });
  const currentBalance = transactions.reduce((balance, transaction) => {
    return transaction.type === 'income' 
      ? balance + transaction.amount 
      : balance - transaction.amount;
  }, 0);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentTransactions = await Transaction.find({
    user: userId,
    date: { $gte: threeMonthsAgo }
  });

  const monthlyNet = recentTransactions.reduce((net, transaction) => {
    return transaction.type === 'income' 
      ? net + (transaction.amount / 3)
      : net - (transaction.amount / 3);
  }, 0);

  return {
    projectedBalance: currentBalance + monthlyNet,
    trend: monthlyNet > 0 ? 'positive' : 'negative'
  };
}

async function getSavingsProjection(userId) {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: lastMonth }
  });

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  return {
    monthlyPotential: Math.max(0, income - expenses),
    trend: income > expenses ? 'positive' : 'negative'
  };
}

async function getFutureExpenses(userId) {
  // Calculer la moyenne des dépenses mensuelles
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const expenses = await Transaction.find({
    user: userId,
    type: 'expense',
    date: { $gte: threeMonthsAgo }
  });

  const monthlyAverage = expenses.reduce((sum, t) => sum + t.amount, 0) / 3;
  
  return {
    nextMonthTotal: monthlyAverage,
    trend: 'stable' // Pourrait être calculé en comparant avec les mois précédents
  };
}
