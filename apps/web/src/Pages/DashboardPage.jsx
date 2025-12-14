import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import Footer from '../components/Footer.jsx';
import { getDashboardData, getWallets, getTransactions, getBudgets, addBudget, addTransaction, getCurrentUser } from '../api.js';
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
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [error, setError] = useState('');
  
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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboard, walletsData, transactions, budgets, userData] = await Promise.all([
          getDashboardData(),
          getWallets(),
          getTransactions({ limit: 8, sort: '-date' }),
          getBudgets(),
          getCurrentUser()
        ]);
        
        setDashboardData(dashboard);
        setWallets(walletsData);
        setRecentTransactions(transactions);
        setUser(userData);
        
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
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };
      
      await addTransaction(transactionData);
      
      // Réinitialiser le formulaire
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        wallet: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowTransactionModal(false);
      
      // Recharger les données
      window.location.reload();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la transaction:', err);
      setError('Erreur lors de l\'ajout de la transaction');
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      const budgetData = {
        name: newBudget.name || newBudget.category || 'Budget sans nom',
        amount: parseFloat(newBudget.amount),
        category: null, // On envoie null au lieu d'une chaîne de texte
        period: newBudget.period
      };
      
      console.log('📤 Envoi du budget:', budgetData);
      await addBudget(budgetData);
      
      // Réinitialiser le formulaire
      setNewBudget({
        name: '',
        amount: '',
        category: '',
        period: 'month'
      });
      
      setShowBudgetModal(false);
      
      // Recharger les données
      window.location.reload();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du budget:', err);
      setError('Erreur lors de l\'ajout du budget');
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 py-4 md:py-6 lg:py-10 px-3 md:px-6 lg:px-8 xl:px-12">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[#343A40] mb-4 md:mb-6 lg:mb-8">
            Bienvenue, {user ? getFirstName(user.name) : 'Utilisateur'}!
          </h1>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Revenu Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#1E73BE]">€{dashboardData?.incomeThisMonth?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#28A745]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Dépenses Totales</div>
              <div className="text-xl md:text-2xl font-bold text-[#6C757D]">€{dashboardData?.spentThisMonth?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#6C757D]">Ce mois-ci</div>
            </div>
            <div className="bg-white rounded-lg border border-[#F5F7FA] p-4 md:p-6 flex flex-col gap-2">
              <div className="text-[#6C757D] text-xs md:text-sm">Solde Total</div>
              <div className="text-xl md:text-2xl font-bold text-[#343A40]">€{dashboardData?.totalBalance?.toLocaleString('fr-FR') || '0.00'}</div>
              <div className="text-xs text-[#28A745]">Tous portefeuilles</div>
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
                    <span className={`font-semibold ${transaction.type === 'expense' ? 'text-[#6C757D]' : 'text-[#28A745]'}`}>
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
              <div className="font-semibold text-[#343A40] mb-2">Objectifs Financiers</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg p-4 bg-gradient-to-br from-[#FDE6E6] to-[#F9D6D6] flex flex-col gap-2">
                  <div className="font-semibold text-[#343A40]">Fonds d'urgence</div>
                  <div className="text-[#343A40] text-sm">Actuel: €{dashboardData?.totalBalance ? Math.round(dashboardData.totalBalance * 0.3).toLocaleString('fr-FR') : '0'}</div>
                  <div className="text-[#6C757D] text-xs">Cible: €10,000</div>
                  <div className="w-full h-2 bg-[#F5F7FA] rounded-full">
                    <div className="h-2 bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, dashboardData?.totalBalance ? (dashboardData.totalBalance * 0.3 / 10000) * 100 : 0)}%` }}></div>
                  </div>
                  <div className="text-xs text-[#6C757D]">{Math.min(100, dashboardData?.totalBalance ? Math.round((dashboardData.totalBalance * 0.3 / 10000) * 100) : 0)}% atteint</div>
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-br from-[#FDF6E6] to-[#F9EED6] flex flex-col gap-2">
                  <div className="font-semibold text-[#343A40]">Épargne voyage</div>
                  <div className="text-[#343A40] text-sm">Actuel: €{dashboardData?.totalBalance ? Math.round(dashboardData.totalBalance * 0.1).toLocaleString('fr-FR') : '0'}</div>
                  <div className="text-[#6C757D] text-xs">Cible: €5,000</div>
                  <div className="w-full h-2 bg-[#F5F7FA] rounded-full">
                    <div className="h-2 bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, dashboardData?.totalBalance ? (dashboardData.totalBalance * 0.1 / 5000) * 100 : 0)}%` }}></div>
                  </div>
                  <div className="text-xs text-[#6C757D]">{Math.min(100, dashboardData?.totalBalance ? Math.round((dashboardData.totalBalance * 0.1 / 5000) * 100) : 0)}% atteint</div>
                </div>
                <div className="rounded-lg p-4 bg-gradient-to-br from-[#E6F6FD] to-[#D6F2F9] flex flex-col gap-2">
                  <div className="font-semibold text-[#343A40]">Investissements</div>
                  <div className="text-[#343A40] text-sm">Actuel: €{dashboardData?.totalBalance ? Math.round(dashboardData.totalBalance * 0.15).toLocaleString('fr-FR') : '0'}</div>
                  <div className="text-[#6C757D] text-xs">Cible: €20,000</div>
                  <div className="w-full h-2 bg-[#F5F7FA] rounded-full">
                    <div className="h-2 bg-[#1E3A8A] rounded-full" style={{ width: `${Math.min(100, dashboardData?.totalBalance ? (dashboardData.totalBalance * 0.15 / 20000) * 100 : 0)}%` }}></div>
                  </div>
                  <div className="text-xs text-[#6C757D]">{Math.min(100, dashboardData?.totalBalance ? Math.round((dashboardData.totalBalance * 0.15 / 20000) * 100) : 0)}% atteint</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Footer */}
      <Footer />

      {/* Modal Ajouter Transaction */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#343A40]">Ajouter une Transaction</h3>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
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
                  onClick={() => setShowTransactionModal(false)}
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
                onClick={() => setShowBudgetModal(false)}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Nom du Budget</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({...newBudget, name: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="Ex: Alimentation"
                  required
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
                <input
                  type="text"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                  placeholder="Ex: Nourriture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#343A40] mb-1">Période</label>
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE]"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="yearly">Annuel</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
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

      {/* Modal Ajouter Transaction */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#343A40]">Ajouter une Transaction</h3>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await addTransaction(newTransaction);
                setShowTransactionModal(false);
                setNewTransaction({ description: '', amount: '', category: '', type: 'expense', date: new Date().toISOString().split('T')[0] });
                // Recharger les données
                const [dashboard, wallets, transactions] = await Promise.all([
                  getDashboardData(),
                  getWallets(),
                  getTransactions({ limit: 5 })
                ]);
                setDashboardData(dashboard);
                setWallets(wallets);
                setRecentTransactions(transactions);
              } catch (err) {
                setError(err.message);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                    placeholder="Ex: Achat épicerie"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Montant (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
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
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Nourriture">🍽️ Nourriture</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Loisirs">🎮 Loisirs</option>
                    <option value="Santé">🏥 Santé</option>
                    <option value="Autres">💳 Autres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Date</label>
                  <input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 border border-[#F5F7FA] text-[#343A40] rounded hover:bg-[#F5F7FA]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1e40af]"
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
                onClick={() => setShowBudgetModal(false)}
                className="text-[#6C757D] hover:text-[#343A40]"
              >
                ✕
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Créer le budget avec le nom de la catégorie comme nom du budget
                const budgetData = {
                  name: newBudget.category || 'Budget sans nom',
                  amount: parseFloat(newBudget.amount),
                  category: null, // On envoie null au lieu d'une chaîne de texte
                  period: newBudget.period
                };
                
                console.log('📤 Envoi du budget:', budgetData);
                await addBudget(budgetData);
                setShowBudgetModal(false);
                setNewBudget({ category: '', amount: '', period: 'month' });
                // Recharger les données
                const dashboard = await getDashboardData();
                setDashboardData(dashboard);
              } catch (err) {
                console.error('❌ Erreur lors de la création du budget:', err);
                setError(err.message);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Catégorie</label>
                  <select
                    value={newBudget.category}
                    onChange={(e) => setNewBudget({...newBudget, category: e.target.value})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Nourriture">🍽️ Nourriture</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Loisirs">🎮 Loisirs</option>
                    <option value="Santé">🏥 Santé</option>
                    <option value="Autres">💳 Autres</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Montant (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBudget.amount}
                    onChange={(e) => setNewBudget({...newBudget, amount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#343A40] mb-1">Période</label>
                  <select
                    value={newBudget.period}
                    onChange={(e) => setNewBudget({...newBudget, period: e.target.value})}
                    className="w-full px-3 py-2 border border-[#F5F7FA] rounded bg-white text-[#343A40]"
                  >
                    <option value="month">Mensuel</option>
                    <option value="week">Hebdomadaire</option>
                    <option value="year">Annuel</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 px-4 py-2 border border-[#F5F7FA] text-[#343A40] rounded hover:bg-[#F5F7FA]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#1E3A8A] text-white rounded hover:bg-[#1e40af]"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
