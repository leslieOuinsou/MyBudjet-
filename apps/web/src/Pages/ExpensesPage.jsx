import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import { getTransactions, getCategories, getWallets, addTransaction, updateTransaction, deleteTransaction, addMissingDefaultData } from '../api.js';
import { 
  MdAdd, MdEdit, MdDelete, MdFilterList, MdSearch, 
  MdTrendingUp, MdTrendingDown, MdAttachMoney 
} from 'react-icons/md';

// Catégories prédéfinies avec icônes - Palette Fintech
const EXPENSE_CATEGORIES = [
  { name: 'Alimentation', icon: 'MdRestaurant', color: '#1E73BE' },
  { name: 'Transport', icon: 'MdDirectionsCar', color: '#6C757D' },
  { name: 'Logement', icon: 'MdHome', color: '#495057' },
  { name: 'Divertissement', icon: 'MdTheaters', color: '#155a8a' },
  { name: 'Santé', icon: 'MdLocalHospital', color: '#ADB5BD' },
  { name: 'Éducation', icon: 'MdSchool', color: '#343A40' },
  { name: 'Shopping', icon: 'MdShoppingCart', color: '#CED4DA' },
  { name: 'Factures', icon: 'MdReceipt', color: '#1E73BE' },
  { name: 'Autres', icon: 'MdMoreHoriz', color: '#6C757D' }
];

// Dépenses rapides prédéfinies
const QUICK_EXPENSES = [
  { name: 'Café', amount: 3.50, category: 'Alimentation', icon: '☕' },
  { name: 'Déjeuner', amount: 12.00, category: 'Alimentation', icon: '🍽️' },
  { name: 'Essence', amount: 50.00, category: 'Transport', icon: '⛽' },
  { name: 'Parking', amount: 5.00, category: 'Transport', icon: '🅿️' },
  { name: 'Cinéma', amount: 15.00, category: 'Divertissement', icon: '🎬' }
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtres avancés
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [amountFilter, setAmountFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("date"); // date, amount, category
  
  // États des modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // États des formulaires
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    wallet: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Statistiques
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    totalThisWeek: 0,
    totalToday: 0,
    averagePerDay: 0,
    categoryBreakdown: []
  });

  useEffect(() => {
    loadData();
  }, []);

  // Recharger les données quand on revient sur la page
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Focus détecté sur ExpensesPage, rechargement des données...');
      loadData();
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page ExpensesPage visible, rechargement des données...');
        loadData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [transactionsData, categoriesData, walletsData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getWallets()
      ]);
      
      // Filtrer seulement les dépenses
      const expensesOnly = transactionsData.filter(t => t.type === 'expense');
      setExpenses(expensesOnly);
      setCategories(categoriesData);
      setWallets(walletsData);
      console.log('✅ Données ExpensesPage actualisées:', { 
        expenses: expensesOnly.length, 
        categories: categoriesData.length, 
        wallets: walletsData.length 
      });
      
      // Calculer les statistiques
      calculateStats(expensesOnly);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expenses) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const thisMonth = expenses.filter(e => new Date(e.date) >= startOfMonth);
    const thisWeek = expenses.filter(e => new Date(e.date) >= startOfWeek);
    const today = expenses.filter(e => new Date(e.date) >= startOfDay);
    
    const totalThisMonth = thisMonth.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalThisWeek = thisWeek.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalToday = today.reduce((sum, e) => sum + (e.amount || 0), 0);
    const averagePerDay = thisMonth.length > 0 ? totalThisMonth / thisMonth.length : 0;
    
    // Répartition par catégorie
    const categoryBreakdown = EXPENSE_CATEGORIES.map(cat => {
      const categoryExpenses = thisMonth.filter(e => e.category?.name === cat.name);
      const total = categoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const percentage = totalThisMonth > 0 ? (total / totalThisMonth) * 100 : 0;
      
      return {
        ...cat,
        total,
        percentage,
        count: categoryExpenses.length
      };
    }).filter(cat => cat.total > 0);
    
    setStats({
      totalThisMonth,
      totalThisWeek,
      totalToday,
      averagePerDay,
      categoryBreakdown
    });
  };

  const handleAddDefaultData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const result = await addMissingDefaultData();
      
      if (result.success) {
        setSuccess(`✅ Données ajoutées: ${result.details.categories.added || 0} catégories, ${result.details.wallets.added || 0} portefeuilles`);
        // Recharger les données pour afficher les nouvelles options
        await loadData();
      } else {
        setError('Erreur lors de l\'ajout des données par défaut');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout des données par défaut:', error);
      setError(error.message || 'Erreur lors de l\'ajout des données par défaut');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        type: 'expense'
      };
      
      if (editingExpense) {
        await updateTransaction(editingExpense._id, expenseData);
        setSuccess('Dépense modifiée avec succès !');
      } else {
        await addTransaction(expenseData);
        setSuccess('Dépense ajoutée avec succès !');
      }
      
      resetForm();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde de la dépense');
    }
  };

  const handleQuickAdd = async (quickExpense) => {
    try {
      setError('');
      
      const expenseData = {
        description: quickExpense.name,
        amount: quickExpense.amount,
        type: 'expense',
        category: categories.find(c => c.name === quickExpense.category)?._id || '',
        wallet: wallets[0]?._id || '',
        date: new Date().toISOString().split('T')[0]
      };
      
      await addTransaction(expenseData);
      setSuccess(`${quickExpense.name} ajouté(e) pour ${quickExpense.amount}€ !`);
      
      setShowQuickAddModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout rapide');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      category: expense.category?._id || '',
      wallet: expense.wallet?._id || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      try {
        setError('');
        await deleteTransaction(id);
        setSuccess('Dépense supprimée avec succès !');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setNewExpense({
      description: '',
      amount: '',
      category: '',
      wallet: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddModal(false);
    setEditingExpense(null);
  };

  // Filtrage et tri des dépenses
  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "Tous" || expense.category?.name === categoryFilter;
      const matchesDate = dateFilter === "Tous" || checkDateFilter(expense.date, dateFilter);
      const matchesAmount = amountFilter === "Tous" || checkAmountFilter(expense.amount, amountFilter);
      
      return matchesSearch && matchesCategory && matchesDate && matchesAmount;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return (b.amount || 0) - (a.amount || 0);
        case 'category':
          return (a.category?.name || '').localeCompare(b.category?.name || '');
        case 'date':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

  const checkDateFilter = (date, filter) => {
    const expenseDate = new Date(date);
    const now = new Date();
    
    switch (filter) {
      case 'Aujourd\'hui':
        return expenseDate.toDateString() === now.toDateString();
      case 'Cette semaine':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= weekAgo;
      case 'Ce mois':
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const checkAmountFilter = (amount, filter) => {
    switch (filter) {
      case 'Petites (< 10€)':
        return amount < 10;
      case 'Moyennes (10-50€)':
        return amount >= 10 && amount < 50;
      case 'Grosses (> 50€)':
        return amount >= 50;
      default:
        return true;
    }
  };

  const getCategoryIcon = (categoryName) => {
    const category = EXPENSE_CATEGORIES.find(c => c.name === categoryName);
    return category?.icon || '💳';
  };

  const getCategoryColor = (categoryName) => {
    const category = EXPENSE_CATEGORIES.find(c => c.name === categoryName);
    return category?.color || '#85C1E9';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        
        {/* Contenu principal */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-6">
          {/* En-tête */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#22292F] mb-2">Gestion des Dépenses</h1>
            <p className="text-[#6C757D]">Suivez et analysez vos dépenses quotidiennes</p>
          </div>

          {/* Messages de statut */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-[#D4EDDA] border border-[#28A745] text-[#155724] rounded-lg">
              {success}
            </div>
          )}

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6C757D]">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-[#22292F]">{stats.totalToday.toFixed(2)}€</p>
                </div>
                <MdAttachMoney className="text-[#1E73BE]" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6C757D]">Cette semaine</p>
                  <p className="text-2xl font-bold text-[#22292F]">{stats.totalThisWeek.toFixed(2)}€</p>
                </div>
                <MdTrendingDown className="text-[#F87171]" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6C757D]">Ce mois</p>
                  <p className="text-2xl font-bold text-[#22292F]">{stats.totalThisMonth.toFixed(2)}€</p>
                </div>
                <MdAttachMoney className="text-[#10B981]" size={32} />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6C757D]">Moyenne/jour</p>
                  <p className="text-2xl font-bold text-[#22292F]">{stats.averagePerDay.toFixed(2)}€</p>
                </div>
                <MdTrendingUp className="text-[#6366F1]" size={32} />
              </div>
            </div>
          </div>

          {/* Bouton pour ajouter les données par défaut */}
          {(categories.length <= 1 || wallets.length <= 1) && (
            <div className="bg-[#E9ECEF] border border-[#CED4DA] rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#495057] mb-2 flex items-center gap-2">
                    <MdFilterList size={24} />
                    Options limitées détectées
                  </h3>
                  <p className="text-[#6C757D] text-sm">
                    Vous n'avez que {categories.length} catégorie(s) et {wallets.length} portefeuille(s). 
                    Ajoutez des options prédéfinies pour une meilleure expérience !
                  </p>
                </div>
                <button
                  onClick={handleAddDefaultData}
                  disabled={loading}
                  className="bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:bg-[#9CA3AF] disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <MdFilterList className="animate-spin" size={20} />
                      Ajout...
                    </>
                  ) : (
                    <>
                      <MdAdd size={20} />
                      Ajouter des options
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Actions rapides */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB] mb-8">
            <h2 className="text-xl font-semibold text-[#22292F] mb-4">Actions Rapides</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#1E3A8A] hover:bg-[#1e40af] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <MdAdd size={20} />
                Ajouter une dépense
              </button>
              
              <button
                onClick={() => setShowQuickAddModal(true)}
                className="bg-[#E5E7EB] text-[#374151] px-6 py-3 rounded-lg font-semibold hover:bg-[#D1D5DB] transition-colors flex items-center gap-2"
              >
                <MdTrendingUp size={20} />
                Dépenses rapides
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-[#EAF4FB] mb-6">
            <h3 className="text-lg font-semibold text-[#22292F] mb-4">Filtres et Recherche</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Recherche</label>
                <input
                  type="text"
                  placeholder="Description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Période</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                >
                  <option value="Tous">Tous</option>
                  <option value="Aujourd'hui">Aujourd'hui</option>
                  <option value="Cette semaine">Cette semaine</option>
                  <option value="Ce mois">Ce mois</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Catégorie</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                >
                  <option value="Tous">Tous</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Montant</label>
                <select
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                  className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                >
                  <option value="Tous">Tous</option>
                  <option value="Petites (< 10€)">Petites (&lt; 10€)</option>
                  <option value="Moyennes (10-50€)">Moyennes (10-50€)</option>
                  <option value="Grosses (> 50€)">Grosses (&gt; 50€)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                >
                  <option value="date">Date</option>
                  <option value="amount">Montant</option>
                  <option value="category">Catégorie</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des dépenses */}
          <div className="bg-white rounded-lg shadow-sm border border-[#EAF4FB]">
            <div className="p-6 border-b border-[#EAF4FB]">
              <h3 className="text-lg font-semibold text-[#22292F]">
                Dépenses ({filteredExpenses.length})
              </h3>
            </div>
            
            <div className="divide-y divide-[#EAF4FB]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E73BE] mx-auto"></div>
                  <p className="text-[#6C757D] mt-2">Chargement...</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-[#6C757D]">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Aucune dépense trouvée</p>
                </div>
              ) : (
                filteredExpenses.map((expense) => (
                  <div key={expense._id} className="p-6 hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                          style={{ backgroundColor: getCategoryColor(expense.category?.name) }}
                        >
                          {getCategoryIcon(expense.category?.name)}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-[#22292F]">{expense.description}</h4>
                          <p className="text-sm text-[#6C757D]">
                            {expense.category?.name || 'Non catégorisé'} • {new Date(expense.date).toLocaleDateString('fr-FR')}
                          </p>
                          {expense.notes && (
                            <p className="text-xs text-[#9CA3AF] mt-1">{expense.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#22292F]">
                            -{expense.amount?.toFixed(2)}€
                          </p>
                          <p className="text-xs text-[#6C757D]">
                            {expense.wallet?.name || 'Portefeuille'}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-[#1E73BE] hover:text-[#1557A0] p-2"
                            title="Modifier"
                          >
                            <MdEdit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="text-[#6C757D] hover:text-[#495057] p-2"
                            title="Supprimer"
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal d'ajout/modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#22292F]">
                {editingExpense ? 'Modifier la dépense' : 'Ajouter une dépense'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-[#6C757D] hover:text-[#495057] text-xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Montant (€)</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Catégorie</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {getCategoryIcon(cat.name)} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Portefeuille</label>
                  <select
                    value={newExpense.wallet}
                    onChange={(e) => setNewExpense({...newExpense, wallet: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  >
                    <option value="">Sélectionner un portefeuille</option>
                    {wallets.map(wallet => (
                      <option key={wallet._id} value={wallet._id}>{wallet.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Date</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#22292F] mb-1">Notes (optionnel)</label>
                  <textarea
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E73BE]"
                    placeholder="Ajoutez des détails..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1E3A8A] text-white py-2 px-4 rounded-md hover:bg-[#1e40af] transition-colors"
                >
                  {editingExpense ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-[#E5E7EB] text-[#374151] py-2 px-4 rounded-md hover:bg-[#D1D5DB] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal dépenses rapides */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#22292F]">Dépenses Rapides</h3>
              <button 
                onClick={() => setShowQuickAddModal(false)}
                className="text-[#6C757D] hover:text-[#495057] text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {QUICK_EXPENSES.map((expense, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAdd(expense)}
                  className="p-4 border border-[#EAF4FB] rounded-lg hover:bg-[#F9FAFB] transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{expense.icon}</span>
                    <span className="font-semibold text-[#22292F]">{expense.amount}€</span>
                  </div>
                  <p className="text-sm text-[#22292F]">{expense.name}</p>
                  <p className="text-xs text-[#6C757D]">{expense.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
