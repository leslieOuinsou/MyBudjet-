import Budget from '../models/budget.js';
import Transaction from '../models/transaction.js';

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
    const budgets = await Budget.find({ user: req.user._id }).populate('category wallet');
    
    // Calculer le montant dépensé pour chaque budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const budgetObj = budget.toObject();
        
        // Calculer les dates de début et fin selon la période
        const now = new Date();
        let startDate = budget.startDate || now;
        let endDate;
        
        switch (budget.period) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            break;
          case 'week':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
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
        
        // Agréger les transactions pour ce budget
        const query = {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lt: endDate }
        };
        
        // Si le budget a une catégorie, filtrer par celle-ci
        if (budget.category) {
          query.category = budget.category._id || budget.category;
        }
        
        const transactions = await Transaction.find(query);
        const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Calculer la progression et les alertes
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const alertThreshold = budget.alertThreshold || 80;
        
        // Déterminer le statut de progression
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
          ...budgetObj,
          spent: spent || 0,
          percentage: Math.round(percentage * 100) / 100,
          status,
          alertMessage,
          remaining: budget.amount - spent,
          daysRemaining: calculateDaysRemaining(budget.period, budget.startDate || new Date())
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
    
    const budget = new Budget({ 
      user: req.user._id, 
      name,
      category: category || null, 
      wallet: wallet || null, 
      amount, 
      period, 
      startDate, 
      endDate,
      alertThreshold 
    });
    
    await budget.save();
    console.log('✅ Budget créé avec succès:', budget._id);
    res.status(201).json(budget);
  } catch (error) {
    console.error('❌ Erreur création budget:', error);
    res.status(500).json({ message: 'Erreur lors de la création du budget', error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { name, category, wallet, amount, period, startDate, endDate, alertThreshold } = req.body;
    console.log('📥 Modification budget - données reçues:', { name, category, wallet, amount, period, startDate, endDate, alertThreshold });
    
    const budget = await Budget.findByIdAndUpdate(
      req.params.id, 
      { name, category, wallet, amount, period, startDate, endDate, alertThreshold }, 
      { new: true }
    );
    
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    
    console.log('✅ Budget modifié avec succès:', budget._id);
    res.json(budget);
  } catch (error) {
    console.error('❌ Erreur modification budget:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du budget', error: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    
    console.log('✅ Budget supprimé avec succès:', req.params.id);
    res.json({ message: 'Budget supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression budget:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du budget', error: error.message });
  }
};
