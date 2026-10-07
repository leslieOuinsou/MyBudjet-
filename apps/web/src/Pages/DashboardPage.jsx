import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getDashboardData, getWallets, getTransactions, getBudgets, addBudget, addTransaction, getCurrentUser, getCategories, getGoals, addGoal, updateGoal, deleteGoal } from '../api.js';
import LineChart from '../components/charts/LineChart.jsx';
import DoughnutChart from '../components/charts/DoughnutChart.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

import { formatMoney, formatDate, currencySymbol } from '../lib/format.js';
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-[#64748B]">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#64748B] mb-4">{error}</p>
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
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#0F172A] mb-4 md:mb-6 lg:mb-8">
            Bienvenue, {user ? getFirstName(user.name) : 'Utilisateur'}!
          </h1>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#64748B] text-xs md:text-sm">Revenu Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#16A34A]">{formatMoney(dashboardData?.incomeThisMonth)}</div>
              <div className="text-xs text-[#16A34A]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#64748B] text-xs md:text-sm">Dépenses Totales</div>
              <div className="text-xl md:text-2xl font-bold text-[#DC2626]">{formatMoney(dashboardData?.spentThisMonth)}</div>
              <div className="text-xs text-[#64748B]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#64748B] text-xs md:text-sm">Solde Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#0F172A]">{formatMoney(dashboardData?.totalBalance)}</div>
              <div className="text-xs text-[#16A34A]">Tous portefeuilles</div>
            </div>
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#64748B] text-xs md:text-sm">Solde des portefeuilles</div>
              <ul className="text-[#0F172A] text-xs md:text-sm mt-2 space-y-1">
                {wallets.map((w, i) => (
                  <li key={i} className="flex justify-between"><span className="truncate pr-2">{w.name}</span><span className="font-semibold whitespace-nowrap">{formatMoney(w.balance)}</span></li>
                ))}
              </ul>
            </div>
          </div>
          {/* Budget restant & Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-[#0F172A]">Budget Restant</div>
                <span className="text-[#64748B] text-xs">Budget du mois</span>
              </div>
              <div className="text-2xl font-bold text-[#2563EB] mb-2">
                {formatMoney(dashboardData?.budgetRemaining)}
              </div>
              <div className="w-full h-2 bg-[#F8FAFC] rounded-full mb-2">
                <div 
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, dashboardData?.budgetPercentage || 0)}%`,
                    backgroundColor: dashboardData?.budgetPercentage > 90 ? '#DC2626' : dashboardData?.budgetPercentage > 70 ? '#F59E0B' : '#2563EB',
                    transition: 'width 700ms ease',
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs text-[#64748B]">
                  {Math.round(dashboardData?.budgetPercentage || 0)}% utilisé
                </div>
                <div className="text-xs text-[#64748B]">
                  Budget total: {formatMoney(dashboardData?.totalBudget)}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 flex flex-col gap-2">
              <div className="font-semibold text-[#0F172A] mb-2">Dépenses par Catégorie</div>
              <div className="text-[#64748B] text-xs mb-2">Ce mois-ci</div>
              {dashboardData?.byCategory && Object.keys(dashboardData.byCategory).length > 0 ? (
                <DoughnutChart
                  data={{
                    labels: Object.keys(dashboardData.byCategory),
                    values: Object.values(dashboardData.byCategory).map((v) => Math.abs(v)),
                  }}
                />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-[#DBEAFE] to-[#F8FAFC] rounded flex items-center justify-center text-[#64748B] text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
          {/* Net worth graph & Recent activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 flex flex-col gap-2">
              <div className="font-semibold text-[#0F172A] mb-2">Évolution Revenus/Dépenses</div>
              <div className="text-[#64748B] text-xs mb-2">6 derniers mois</div>
              {dashboardData?.stats && dashboardData.stats.length > 0 ? (
                <LineChart
                  data={{
                    labels: dashboardData.stats.slice(-6).map((stat) => (stat.month || '').split(' ')[0]),
                    income: dashboardData.stats.slice(-6).map((stat) => stat.income),
                    expense: dashboardData.stats.slice(-6).map((stat) => stat.expense),
                  }}
                />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-[#DBEAFE] to-[#F8FAFC] rounded flex items-center justify-center text-[#64748B] text-sm">
                  Aucune donnée disponible
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 flex flex-col gap-2">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-[#0F172A]">Activité Récente</div>
                <a href="#" className="text-[#2563EB] text-xs font-semibold hover:underline">Voir tout</a>
              </div>
              <ul className="divide-y divide-[#F8FAFC]">
                {recentTransactions.map((transaction, i) => (
                  <li key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryIcons[transaction.category?.name] || categoryIcons['Autres']}</span>
                      <span className="text-[#0F172A] text-sm">{transaction.description || transaction.category?.name || 'Transaction'}</span>
                    </div>
                    <span className={`font-semibold ${transaction.type === 'expense' ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                      {transaction.type === 'expense' ? '-' : '+'}{formatMoney(transaction.amount)}
                    </span>
                    <span className="text-[#64748B] text-xs w-24 text-right">
                      {formatDate(transaction.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Quick actions & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 flex flex-col gap-4">
              <div className="font-semibold text-[#0F172A] mb-2">Actions Rapides</div>
              <button 
                onClick={() => setShowTransactionModal(true)}
                className="w-full bg-[#1E3A8A] text-white px-4 py-2 rounded font-semibold hover:bg-[#1e40af] flex items-center gap-2 justify-center"
              >
                <span className="text-lg">+</span> Ajouter une Transaction
              </button>
              <button 
                onClick={() => setShowBudgetModal(true)}
                className="w-full bg-[#E2E8F0] text-[#1E293B] px-4 py-2 rounded font-semibold border border-[#E2E8F0] hover:bg-[#CBD5E1]"
              >
                Créer un Budget
              </button>
              <Link 
                to="/reports" 
                className="w-full bg-[#E2E8F0] text-[#1E293B] px-4 py-2 rounded font-semibold border border-[#E2E8F0] hover:bg-[#CBD5E1] text-center"
              >
                Voir les Rapports
              </Link>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-[#0F172A]">Objectifs Financiers</div>
                <button
                  type="button"
                  onClick={openCreateGoal}
                  className="text-sm text-[#2563EB] font-semibold hover:underline"
                >
                  + Ajouter
                </button>
              </div>
              {goals.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#E2E8F0] p-6 text-center text-[#64748B] text-sm">
                  Aucun objectif. Créez votre premier objectif d&apos;épargne.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {goals.map((goal) => {
                    const id = goal._id || goal.id;
                    const percentage = goal.percentage ?? 0;
                    const bg = goal.color || '#DBEAFE';
                    return (
                      <div
                        key={id}
                        className="rounded-lg p-4 flex flex-col gap-2"
                        style={{ background: `linear-gradient(to bottom right, ${bg}, ${bg}cc)` }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-[#0F172A]">{goal.name}</div>
                          <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => openEditGoal(goal)} className="text-xs text-[#2563EB] hover:underline">
                              Modifier
                            </button>
                            <button type="button" onClick={() => handleDeleteGoal(id)} className="text-xs text-[#64748B] hover:underline">
                              Suppr.
                            </button>
                          </div>
                        </div>
                        <div className="text-[#0F172A] text-sm">
                          Actuel: {formatMoney(Number(goal.currentAmount || 0))}
                        </div>
                        <div className="text-[#64748B] text-xs">
                          Cible: {formatMoney(Number(goal.targetAmount || 0))}
                        </div>
                        {goal.deadline && (
                          <div className="text-[#64748B] text-xs">
                            Échéance: {formatDate(goal.deadline)}
                          </div>
                        )}
                        <div className="w-full h-2 bg-[#F8FAFC] rounded-full">
                          <div
                            className={`h-2 rounded-full ${goal.achieved ? 'bg-[#16A34A]' : 'bg-[#1E3A8A]'}`}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-[#64748B]">
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
              <h3 className="text-lg font-semibold text-[#0F172A]">Ajouter une Transaction</h3>
              <button 
                onClick={() => { setShowTransactionModal(false); setFormError(''); }}
                className="text-[#64748B] hover:text-[#0F172A]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Description</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  placeholder="Ex: Achat supermarché"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Montant ({currencySymbol()})</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Type</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="expense">Dépense</option>
                  <option value="income">Revenu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Catégorie</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Portefeuille</label>
                <select
                  value={newTransaction.wallet}
                  onChange={(e) => setNewTransaction({...newTransaction, wallet: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Date</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowTransactionModal(false); setFormError(''); }}
                  className="flex-1 bg-[#F8FAFC] text-[#0F172A] py-2 rounded hover:bg-gray-200"
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
              <h3 className="text-lg font-semibold text-[#0F172A]">Créer un Budget</h3>
              <button 
                onClick={() => { setShowBudgetModal(false); setFormError(''); }}
                className="text-[#64748B] hover:text-[#0F172A]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nom du Budget</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  placeholder="Ex: Alimentation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Montant ({currencySymbol()})</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Catégorie</label>
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Période</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
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
                  className="flex-1 bg-[#F8FAFC] text-[#0F172A] py-2 rounded hover:bg-gray-200"
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
              <h3 className="text-lg font-semibold text-[#0F172A]">
                {editingGoalId ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h3>
              <button
                onClick={() => { setShowGoalModal(false); setFormError(''); }}
                className="text-[#64748B] hover:text-[#0F172A]"
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
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Nom</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  placeholder="Ex: Fonds d'urgence"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Montant cible ({currencySymbol()})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalForm.targetAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Montant actuel ({currencySymbol()})</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={goalForm.currentAmount}
                  onChange={(e) => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-1">Échéance (optionnel)</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded px-3 py-2 focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowGoalModal(false); setFormError(''); }}
                  className="flex-1 bg-[#F8FAFC] text-[#0F172A] py-2 rounded hover:bg-gray-200"
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
