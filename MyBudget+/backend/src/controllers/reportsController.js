import Transaction from '../models/transaction.js';
import Budget from '../models/budget.js';
import Category from '../models/category.js';
import Wallet from '../models/wallet.js';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

// Obtenir les statistiques financières générales
export const getFinancialStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { period = 'month' } = req.query;

    // Calculer les dates selon la période
    const now = new Date();
    let startDate, endDate = now;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Statistiques de base
    const [incomeStats, expenseStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const totalIncome = incomeStats[0]?.total || 0;
    const totalExpense = expenseStats[0]?.total || 0;
    const savings = totalIncome - totalExpense;

    // Calculer les variations par rapport à la période précédente
    const previousStart = new Date(startDate);
    const previousEnd = new Date(startDate);
    
    switch (period) {
      case 'week':
        previousStart.setDate(previousStart.getDate() - 7);
        break;
      case 'month':
        previousStart.setMonth(previousStart.getMonth() - 1);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;
      case 'year':
        previousStart.setFullYear(previousStart.getFullYear() - 1);
        previousEnd.setDate(previousEnd.getDate() - 1);
        break;
    }

    const [previousIncomeStats, previousExpenseStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income', date: { $gte: previousStart, $lte: previousEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: previousStart, $lte: previousEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const previousIncome = previousIncomeStats[0]?.total || 0;
    const previousExpense = previousExpenseStats[0]?.total || 0;
    const previousSavings = previousIncome - previousExpense;

    // Calculer les variations en pourcentage
    const incomeVariation = previousIncome > 0 ? ((totalIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseVariation = previousExpense > 0 ? ((totalExpense - previousExpense) / previousExpense) * 100 : 0;
    const savingsVariation = previousSavings !== 0 ? ((savings - previousSavings) / Math.abs(previousSavings)) * 100 : 0;

    res.json({
      totalIncome,
      totalExpense,
      savings,
      incomeVariation: Math.round(incomeVariation * 100) / 100,
      expenseVariation: Math.round(expenseVariation * 100) / 100,
      savingsVariation: Math.round(savingsVariation * 100) / 100,
      period,
      startDate,
      endDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

// Obtenir l'analyse par catégorie
export const getCategoryAnalytics = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { startDate, endDate, type = 'expense' } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      // Par défaut, le mois courant
      const now = new Date();
      dateFilter = { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: now } };
    }

    const categoryStats = await Transaction.aggregate([
      { $match: { user: userId, type, ...dateFilter } },
      { 
        $group: { 
          _id: '$category', 
          total: { $sum: '$amount' }, 
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        } 
      },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { 
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryInfo.name', 'Non catégorisé'] },
          categoryColor: { $ifNull: ['$categoryInfo.color', '#CBD5E1'] },
          total: 1,
          count: 1,
          avgAmount: { $round: ['$avgAmount', 2] }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalAmount = categoryStats.reduce((sum, cat) => sum + cat.total, 0);
    
    const analyticsWithPercentage = categoryStats.map(cat => ({
      ...cat,
      percentage: totalAmount > 0 ? Math.round((cat.total / totalAmount) * 100 * 100) / 100 : 0
    }));

    res.json({
      categories: analyticsWithPercentage,
      totalAmount,
      type,
      period: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des analyses par catégorie', error: error.message });
  }
};

// Obtenir la comparaison budget vs réalisé
export const getBudgetComparison = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { period = 'month' } = req.query;

    // Récupérer tous les budgets de l'utilisateur
    const budgets = await Budget.find({ user: userId }).populate('category');
    
    // Calculer les dépenses réelles par catégorie pour la période
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const actualSpending = await Transaction.aggregate([
      { 
        $match: { 
          user: userId, 
          type: 'expense',
          date: { $gte: startDate, $lte: now }
        } 
      },
      { 
        $group: { 
          _id: '$category', 
          spent: { $sum: '$amount' } 
        } 
      }
    ]);

    // Créer un map pour les dépenses réelles
    const spentMap = new Map();
    actualSpending.forEach(item => {
      if (item._id) {
        spentMap.set(item._id.toString(), item.spent);
      }
    });

    // Comparer budget vs réalisé
    const comparison = budgets.map(budget => {
      const categoryId = budget.category?._id?.toString();
      const spent = spentMap.get(categoryId) || 0;
      const budgetAmount = budget.amount || 0;
      const remaining = budgetAmount - spent;
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      return {
        categoryId: budget.category?._id,
        categoryName: budget.category?.name || 'Non catégorisé',
        categoryColor: budget.category?.color || '#CBD5E1',
        budgeted: budgetAmount,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });

    res.json({
      comparison,
      period,
      totalBudgeted: budgets.reduce((sum, b) => sum + b.amount, 0),
      totalSpent: Array.from(spentMap.values()).reduce((sum, spent) => sum + spent, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la comparaison des budgets', error: error.message });
  }
};

// Obtenir les tendances selon la période
export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { period = 'month' } = req.query;

    const now = new Date();
    let startDate, endDate = now;
    let groupBy, dateFormat;
    
    // Définir la période et le groupement selon le paramètre
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          type: '$type'
        };
        dateFormat = 'day';
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          week: { $week: '$date' },
          type: '$type'
        };
        dateFormat = 'week';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        };
        dateFormat = 'month';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          week: { $week: '$date' },
          type: '$type'
        };
        dateFormat = 'week';
    }

    const trends = await Transaction.aggregate([
      { 
        $match: { 
          user: userId,
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: groupBy,
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
    ]);

    // Organiser les données selon le format
    const organizedData = {};
    trends.forEach(trend => {
      let key;
      
      switch (dateFormat) {
        case 'day':
          key = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`;
          break;
        case 'week':
          key = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.week).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`;
          break;
        default:
          key = `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.week).padStart(2, '0')}`;
      }
      
      if (!organizedData[key]) {
        organizedData[key] = { income: 0, expense: 0, period: key };
      }
      organizedData[key][trend._id.type] = trend.total;
    });

    // Convertir en array et calculer les économies
    const trendsArray = Object.values(organizedData).map(item => ({
      ...item,
      savings: item.income - item.expense,
      savingsRate: item.income > 0 ? ((item.income - item.expense) / item.income) * 100 : 0
    }));

    res.json({
      trends: trendsArray,
      period,
      dateFormat,
      startDate,
      endDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tendances', error: error.message });
  }
};

// Obtenir les top transactions
export const getTopTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { limit = 10, type = 'expense', startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    } else {
      // Par défaut, le mois courant
      const now = new Date();
      dateFilter = { date: { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: now } };
    }

    const topTransactions = await Transaction.find({
      user: userId,
      type,
      ...dateFilter
    })
    .populate('category')
    .populate('wallet')
    .sort({ amount: -1 })
    .limit(parseInt(limit));

    res.json({
      transactions: topTransactions,
      type,
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des top transactions', error: error.message });
  }
};

// Exporter les données de rapport
export const exportReportData = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { format = 'csv', startDate, endDate, type } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = { date: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    let typeFilter = {};
    if (type && type !== 'all') {
      typeFilter = { type };
    }

    const transactions = await Transaction.find({
      user: userId,
      ...dateFilter,
      ...typeFilter
    })
    .populate('category')
    .populate('wallet')
    .sort({ date: -1 });

    if (format === 'csv') {
      const fields = [
        { label: 'Date', value: 'date' },
        { label: 'Description', value: 'description' },
        { label: 'Catégorie', value: 'category.name' },
        { label: 'Portefeuille', value: 'wallet.name' },
        { label: 'Type', value: 'type' },
        { label: 'Montant', value: 'amount' }
      ];
      
      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(transactions);
      
      res.header('Content-Type', 'text/csv');
      res.attachment(`rapport_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    } else if (format === 'pdf') {
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment(`rapport_transactions_${new Date().toISOString().split('T')[0]}.pdf`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Rapport de Transactions MyBudget+', 50, 50);
      doc.fontSize(12).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 50, 80);
      
      let yPosition = 120;
      doc.text('Date', 50, yPosition);
      doc.text('Description', 120, yPosition);
      doc.text('Catégorie', 250, yPosition);
      doc.text('Montant', 350, yPosition);
      doc.text('Type', 450, yPosition);
      
      yPosition += 20;
      
      transactions.forEach(transaction => {
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
        }
        
        doc.text(new Date(transaction.date).toLocaleDateString('fr-FR'), 50, yPosition);
        doc.text(transaction.description || '', 120, yPosition);
        doc.text(transaction.category?.name || 'N/A', 250, yPosition);
        doc.text(`${transaction.amount.toFixed(2)} €`, 350, yPosition);
        doc.text(transaction.type, 450, yPosition);
        
        yPosition += 15;
      });
      
      doc.end();
    } else {
      return res.status(400).json({ message: 'Format non supporté' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'export', error: error.message });
  }
};

// Obtenir toutes les données de rapport (endpoint principal)
export const getReportsData = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { period = 'month' } = req.query;

    // Calculer directement toutes les données dans cette fonction
    const now = new Date();
    let startDate, endDate = now;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Statistiques de base
    const [incomeStats, expenseStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const totalIncome = incomeStats[0]?.total || 0;
    const totalExpense = expenseStats[0]?.total || 0;
    const savings = totalIncome - totalExpense;

    // Top transactions
    const topTransactions = await Transaction.find({
      user: userId,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })
    .populate('category')
    .populate('wallet')
    .sort({ amount: -1 })
    .limit(5);

    // Analyse par catégorie
    const categoryStats = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: '$category', 
          total: { $sum: '$amount' }, 
          count: { $sum: 1 }
        } 
      },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      { 
        $project: {
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryInfo.name', 'Non catégorisé'] },
          categoryColor: { $ifNull: ['$categoryInfo.color', '#CBD5E1'] },
          total: 1,
          count: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    const totalCategoryAmount = categoryStats.reduce((sum, cat) => sum + cat.total, 0);
    const categoriesWithPercentage = categoryStats.map(cat => ({
      ...cat,
      percentage: totalCategoryAmount > 0 ? Math.round((cat.total / totalCategoryAmount) * 100 * 100) / 100 : 0
    }));

    res.json({
      stats: {
        totalIncome,
        totalExpense,
        savings,
        period,
        startDate,
        endDate
      },
      categoryAnalytics: {
        categories: categoriesWithPercentage,
        totalAmount: totalCategoryAmount
      },
      topTransactions: {
        transactions: topTransactions
      },
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rapport', error: error.message });
  }
};
