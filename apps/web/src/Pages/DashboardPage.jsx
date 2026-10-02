import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getDashboardData, getWallets, getTransactions, getBudgets, addBudget, addTransaction, getCurrentUser, getCategories, getGoals, addGoal, updateGoal, deleteGoal } from '../api.js';
import NotificationBell from '../components/NotificationBell.jsx';

// Icônes par catégorie
const categoryIcons = {
  'Nourriture': '🍽️',
  'Shopping': '🛍️',
  'Salaire': '💼',
  'Logement': '🏠',
  'Transport': '🚗',
  'Divertissement': '🎉',
  'Facture': '🧾',
  'Remboursement': '💸',
  'Autres': '💳'
};

// Fonction pour générer les initiales
const getInitials = (name) => {
  if (!name) return 'U';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Fonction pour obtenir le prénom
const getFirstName = (name) => {
  if (!name) return 'Utilisateur';
  return name.trim().split(' ')[0];
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goals, setGoals] = useState([]);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  
  // Form states
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    wallet: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [newBudget, setNewBudget] = useState({
    name: '',
    amount: '',
    category: '',
    period: 'month'
  });

  const [goalForm, setGoalForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboard, walletsData, transactions, budgets, userData, categoriesData, goalsData] = await Promise.all([
          getDashboardData(),
          getWallets(),
          getTransactions({ limit: 8, sort: '-date' }),
          getBudgets(),
          getCurrentUser(),
          getCategories(),
          getGoals()
        ]);
        
        setDashboardData(dashboard);
        setWallets(walletsData);
        setCategories(categoriesData || []);
        setRecentTransactions(transactions);
        setUser(userData);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        
        // Calculer le budget total et restant
        const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
        const budgetUsed = dashboard.spentThisMonth || 0;
        const budgetRemaining = Math.max(0, totalBudget - budgetUsed);
        const budgetPercentage = totalBudget > 0 ? Math.min(100, (budgetUsed / totalBudget) * 100) : 0;
        
        setDashboardData(prev => ({
          ...prev,
          totalBudget,
          budgetUsed,
          budgetRemaining,
          budgetPercentage
        }));
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // CRUD Functions
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      
      // Validation des champs requis
      if (!newTransaction.description || !newTransaction.description.trim()) {
        setFormError('La description est requise');
        return;
      }
      
      if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
        setFormError('Le montant doit être supérieur à 0');
        return;
      }
      
      if (!newTransaction.category) {
        setFormError('Veuillez sélectionner une catégorie');
        return;
      }
      
      if (!newTransaction.wallet) {
        setFormError('Veuillez sélectionner un portefeuille');
        return;
      }
      
      const transactionData = {
        description: newTransaction.description.trim(),
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type || 'expense',
        category: newTransaction.category,
        wallet: newTransaction.wallet,
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        notes: newTransaction.notes || ''
      };
      
      console.log('📤 Envoi de la transaction:', transactionData);
      
      await addTransaction(transactionData);
      
      // Réinitialiser le formulaire
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        wallet: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setShowTransactionModal(false);
      
      // Recharger les données
      window.location.reload();
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout de la transaction:', err);
      setFormError(err.message || 'Erreur lors de l\'ajout de la transaction');
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      if (!newBudget.amount || parseFloat(newBudget.amount) <= 0) {
        setFormError('Le montant du budget doit être supérieur à 0');
        return;
      }

      const selectedCategory = categories.find(
        (c) => (c._id || c.id) === newBudget.category
      );

      const budgetData = {
        name: newBudget.name || selectedCategory?.name || 'Budget sans nom',
        amount: parseFloat(newBudget.amount),
        category: newBudget.category || null,
        period: newBudget.period || 'month'
      };
      
      console.log('📤 Envoi du budget:', budgetData);
      await addBudget(budgetData);
      
      setNewBudget({
        name: '',
        amount: '',
        category: '',
        period: 'month'
      });
      
      setShowBudgetModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du budget:', err);
      setFormError(err.message || 'Erreur lors de l\'ajout du budget');
    }
  };

  const openCreateGoal = () => {
    setEditingGoalId(null);
    setGoalForm({ name: '', targetAmount: '', currentAmount: '0', deadline: '' });
    setFormError('');
    setShowGoalModal(true);
  };

  const openEditGoal = (goal) => {
    setEditingGoalId(goal._id || goal.id);
    setGoalForm({
      name: goal.name || '',
      targetAmount: goal.targetAmount ?? '',
      currentAmount: goal.currentAmount ?? 0,
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
    });
    setFormError('');
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      setFormError('');
      const payload = {
        name: goalForm.name.trim(),
        targetAmount: parseFloat(goalForm.targetAmount),
        currentAmount: parseFloat(goalForm.currentAmount) || 0,
        deadline: goalForm.deadline || null,
      };
      if (!payload.name) {
        setFormError('Le nom est requis');
        return;
      }
      if (!payload.targetAmount || payload.targetAmount <= 0) {
        setFormError('Le montant cible doit être supérieur à 0');
        return;
      }

      if (editingGoalId) {
        await updateGoal(editingGoalId, payload);
      } else {
        await addGoal(payload);
      }
      const refreshed = await getGoals();
      setGoals(Array.isArray(refreshed) ? refreshed : []);
      setShowGoalModal(false);
      setEditingGoalId(null);
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la sauvegarde de l\'objectif');
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Supprimer cet objectif ?')) return;
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => (g._id || g.id) !== goalId));
    } catch (err) {
      setFormError(err.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#6C757D] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#1E3A8A] text-white px-4 py-2 rounded hover:bg-[#1e40af]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <div className="flex flex-1 min-h-0">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 py-4 md:py-6 lg:py-10 px-3 md:px-6 lg:px-8 xl:px-12 overflow-y-auto">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#343A40] mb-4 md:mb-6 lg:mb-8">
            Bienvenue, {user ? getFirstName(user.name) : 'Utilisateur'}!
          </h1>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Revenu Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#1E73BE]">€{dashboardData?.incomeThisMonth?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#22C55E]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Dépenses Totales</div>
              <div className="text-xl md:text-2xl font-bold text-[#6C757D]">€{dashboardData?.spentThisMonth?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#6C757D]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Solde Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#343A40]">€{dashboardData?.totalBalance?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#22C55E]">Tous portefeuilles</div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Solde des portefeuilles</div>
              <ul className="text-[#343A40] text-xs md:text-sm mt-2 space-y-1">
                {wallets.map((w, i) => (
                  <li key={i} className="flex justify-between"><span className="truncate pr-2">{w.name}</span><span className="font-semibold whitespace-nowrap">€{w.balance?.toLocaleString('fr-FR') || '0'}</span></li>
                ))}
              </ul>
            </div>
          </div>
          {/* Budget restant & Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-6 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-[#343A40]">Budget Restant</div>
                <span className="text-[#6C757D] text-xs">Budget du mois</span>
              </div>
              <div className="text-2xl font-bold text-[#1E73BE] mb-2">
                €{dashboardData?.budgetRemaining?.toLocaleString('fr-FR') || '0.00'}
              </div>
              <div className="w-full h-2 bg-[#F5F7FA] rounded-full mb-2">
                <div 
                  className={`h-2 rounded-full ${dashboardData?.budgetPercentage > 90 ? 'bg-[#495057]' : dashboardData?.budgetPercentage > 70 ? 'bg-[#6C757D]' : 'bg-[#1E3A8A]'}`}
                  style={{ width: `${dashboardData?.budgetPercentage || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-[#6C757D]">
                  {Math.round(dashboardData?.budgetPercentage || 0)}% utilisé
                </div>
                <div className="text-xs text-[#6C757D]">
                  Budget total: €{dashboardData?.totalBudget?.toLocaleString('fr-FR') || '0'}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-6 flex flex-col gap-2">
              <div className="font-semibold text-[#343A40] mb-2">Dépenses par Catégorie</div>
              <div className="text-[#6C757D] text-xs mb-2">Ce mois-ci</div>
              <div className="h-32">
                {dashboardData?.byCategory && Object.keys(dashboardData.byCategory).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(dashboardData.byCategory).slice(0, 4).map(([category, amount], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{categoryIcons[category] || '💳'}</span>
                          <span className="text-sm text-[#343A40]">{category}</span>
                        </div>
                        <span className="text-sm font-semibold text-[#6C757D]">€{Math.abs(amount).toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E9F7FB] to-[#F5F7FA] rounded flex items-center justify-center text-[#6C757D] text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Net worth graph & Recent activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-6 flex flex-col gap-2">
              <div className="font-semibold text-[#343A40] mb-2">Évolution Revenus/Dépenses</div>
              <div className="text-[#6C757D] text-xs mb-2">6 derniers mois</div>
              <div className="h-32">
                {dashboardData?.stats && dashboardData.stats.length > 0 ? (
                  <div className="flex items-end justify-between h-full gap-1">
                    {dashboardData.stats.slice(-6).map((stat, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="flex flex-col items-center gap-1 mb-1">
                          <div 
                            className="bg-[#22C55E] rounded-t" 
                            style={{ height: `${(stat.income / Math.max(...dashboardData.stats.map(s => Math.max(s.income, s.expense)))) * 80}px`, minHeight: '4px', width: '12px' }}
                          ></div>
                          <div 
                            className="bg-[#6C757D] rounded-b" 
                            style={{ height: `${(stat.expense / Math.max(...dashboardData.stats.map(s => Math.max(s.income, s.expense)))) * 80}px`, minHeight: '4px', width: '12px' }}
                          ></div>
                        </div>
                        <span className="text-xs text-[#6C757D] transform -rotate-45 origin-bottom-left">
                          {stat.month?.substring(0, 3) || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E9F7FB] to-[#F5F7FA] rounded flex items-center justify-center text-[#6C757D] text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-6 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-[#343A40]">Activité Récente</div>
                <a href="#" className="text-[#1E73BE] text-xs font-semibold hover:underline">Voir tout</a>
              </div>
              <ul className="divide-y divide-[#F5F7FA]">
                {recentTransactions.map((transaction, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryIcons[transaction.category?.name] || categoryIcons['Autres']}</span>
                      <span className="text-[#343A40] text-sm">{transaction.description || transaction.category?.name || 'Transaction'}</span>
                    </div>
                    <span className={`font-semibold ${transaction.type === 'expense' ? 'text-[#374151]' : 'text-[#22C55E]'}`}>
                      {transaction.type === 'expense' ? '-' : '+'}€{transaction.amount?.toLocaleString('fr-FR') || '0'}
                    </span>
                    <span className="text-[#6C757D] text-xs w-24 text-right">
                      {new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Quick actions & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-6 flex flex-col gap-4">
              <div className="font-semibold text-[#343A40] mb-2">Actions Rapides</div>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="w-full bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:bg-[#1e40af] flex items-center gap-2 justify-center"
              >
                <span className="text-lg">+</span> Ajouter une Transaction
              </button>
              <button 
                onClick={() => setShowBudgetModal(true)}
                className="w-full bg-[#E5E7EB] text-[#374151] px-4 py-2 rounded font-semibold border border-[#E5E7EB] hover:bg-[#D1D5DB]"
              >
                Créer un Budget
              </button>
              <Link 
                to="/reports" 
                className="w-full bg-[#E5E7EB] text-[#374151] px-4 py-2 rounded font-semibold border border-[#E5E7EB] hover:bg-[#D1D5DB] text-center"
              >
                Voir les Rapports
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-[#343A40]">Objectifs Financiers</div>
                <button
                  type="button"
                  onClick={openCreateGoal}
                  className="text-sm text-[#1E73BE] font-semibold hover:underline"
                >
                  + Ajouter
                </button>
              </div>
              {goals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E5E7EB] p-6 text-center text-[#6C757D] text-sm">
                  Aucun objectif. Créez votre premier objectif d&apos;épargne.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {goals.map((goal) => {
                    const id = goal._id || goal.id;
                    const percentage = goal.percentage ?? 0;
                    const bg = goal.color || '#E6F6FD';
                    return (
                      <div
                        key={id}
                        className="rounded-lg p-4 flex flex-col gap-2"
                        style={{ background: `linear-gradient(to bottom right, ${bg}, ${bg}cc)` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-[#343A40]">{goal.name}</div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => openEditGoal(goal)} className="text-xs text-[#1E73BE] hover:underline">
                              Modifier
                            </button>
                            <button type="button" onClick={() => handleDeleteGoal(id)} className="text-xs text-[#6C757D] hover:underline">
                              Suppr.
                            </button>
                          </div>
                        </div>
                        <div className="text-[#343A40] text-sm">
                          Actuel: €{Number(goal.currentAmount || 0).toLocaleString('fr-FR')}
                        </div>
                        <div className="text-[#6C757D] text-xs">
                          Cible: €{Number(goal.targetAmount || 0).toLocaleString('fr-FR')}
                        </div>
                        {goal.deadline && (
                          <div className="text-[#6C757D] text-xs">
                            Échéance: {new Date(goal.deadline).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        <div className="w-full h-2 bg-[#F5F7FA] rounded-full">
                          <div
                            className={`h-2 rounded-full ${goal.achieved ? 'bg-[#22C55E]' : 'bg-[#1E3A8A]'}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-[#6C757D]">
                          {percentage}% atteint
                          {goal.achieved ? ' ✓' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ajouter Transaction */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#343A40]">Ajouter une Transaction</h3>
              <button 
                onClick={() => { setShowTransactionModal(false); setFormError(''); }}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            {formError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="Ex: Achat supermarché"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Catégorie</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories
                    .filter((c) => !c.type || c.type === newTransaction.type)
                    .map((cat) => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Portefeuille</label>
                <select
                  value={newTransaction.wallet}
                  onChange={(e) => setNewTransaction({...newTransaction, wallet: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  required
                >
                  <option value="">Sélectionner un portefeuille</option>
                  {wallets.map((wallet) => (
                    <option key={wallet._id || wallet.id} value={wallet._id || wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowTransactionModal(false); setFormError(''); }}
                  className="flex-1 bg-[#F5F7FA] text-[#343A40] py-2 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1E3A8A] text-white py-2 rounded hover:bg-[#1e40af]"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Créer Budget */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#343A40]">Créer un Budget</h3>
              <button 
                onClick={() => { setShowBudgetModal(false); setFormError(''); }}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            {formError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {formError}
              </div>
            )}
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Nom du Budget</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="Ex: Alimentation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Catégorie</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                >
                  <option value="">Général (toutes catégories)</option>
                  {categories
                    .filter((c) => !c.type || c.type === 'expense')
                    .map((cat) => (
                      <option key={cat._id || cat.id} value={cat._id || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Période</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                >
                  <option value="month">Mensuel</option>
                  <option value="week">Hebdomadaire</option>
                  <option value="year">Annuel</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowBudgetModal(false); setFormError(''); }}
                  className="flex-1 bg-[#F5F7FA] text-[#343A40] py-2 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1E3A8A] text-white py-2 rounded hover:bg-[#1e40af]"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Objectif financier */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#343A40]">
                {editingGoalId ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h3>
              <button
                onClick={() => { setShowGoalModal(false); setFormError(''); }}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            {formError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                {formError}
              </div>
            )}
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Nom</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="Ex: Fonds d'urgence"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Montant cible (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Montant actuel (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Échéance (optionnel)</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowGoalModal(false); setFormError(''); }}
                  className="flex-1 bg-[#F5F7FA] text-[#343A40] py-2 rounded hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1E3A8A] text-white py-2 rounded hover:bg-[#1e40af]"
                >
                  {editingGoalId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
