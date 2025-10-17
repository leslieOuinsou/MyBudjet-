import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { getTransactions, getCategories, getWallets, addTransaction, updateTransaction, deleteTransaction } from '../api.js';
import { 
  MdSearch, MdAdd, MdFilterList, MdCalendarToday, 
  MdCategory, MdSwapVert, MdTrendingUp, MdTrendingDown,
  MdEdit, MdDelete 
} from 'react-icons/md';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtres
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("Tous");
  const [catFilter, setCatFilter] = useState("Tous");
  const [typeFilter, setTypeFilter] = useState("Tous");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Form states
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    wallet: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
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
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setWallets(walletsData);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };
      
      if (editingTransaction) {
        await updateTransaction(editingTransaction._id, transactionData);
        setSuccess('Transaction modifiée avec succès !');
      } else {
        await addTransaction(transactionData);
        setSuccess('Transaction ajoutée avec succès !');
      }
      
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        wallet: '',
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowModal(false);
      setEditingTransaction(null);
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde de la transaction');
    }
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      description: transaction.description || '',
      amount: transaction.amount?.toString() || '',
      type: transaction.type || 'expense',
      category: transaction.category?._id || '',
      wallet: transaction.wallet?._id || '',
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        setError('');
        await deleteTransaction(id);
        setSuccess('Transaction supprimée avec succès !');
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.message || 'Erreur lors de la suppression de la transaction');
      }
    }
  };

  // Filtrer les transactions par date
  const filterByDate = (transaction) => {
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    
    switch (dateFilter) {
      case "Aujourd'hui":
        return transactionDate.toDateString() === today.toDateString();
      case "Cette Semaine":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return transactionDate >= startOfWeek;
      case "Ce Mois":
        return transactionDate.getMonth() === today.getMonth() && 
               transactionDate.getFullYear() === today.getFullYear();
      case "Cette Année":
        return transactionDate.getFullYear() === today.getFullYear();
      default:
        return true;
    }
  };

  const filtered = transactions.filter(t => {
    const matchSearch = search === "" || 
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) || 
      (t.category?.name && t.category.name.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === "Tous" || (t.category?.name === catFilter);
    const matchType = typeFilter === "Tous" || t.type === typeFilter;
    const matchDate = filterByDate(t);
    
    return matchSearch && matchCat && matchType && matchDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">Chargement des transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#1a1a1a] flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-10 flex flex-col pt-16 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#22292F] dark:text-white">Transactions</h1>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D]" size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher par description ou catégorie..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="border border-[#EAF4FB] dark:border-[#404040] rounded-lg pl-10 pr-4 py-2 bg-[#F9FAFB] dark:bg-[#2d2d2d] text-[#22292F] dark:text-white focus:border-[#1E73BE] focus:outline-none w-80 transition-colors" 
                />
              </div>
              <button 
                onClick={() => {
                  setEditingTransaction(null);
                  setNewTransaction({
                    description: '',
                    amount: '',
                    type: 'expense',
                    category: '',
                    wallet: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                  setShowModal(true);
                }}
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <MdAdd size={20} />
                Ajouter une transaction
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          {/* Filtres */}
          <section className="bg-white dark:bg-[#2d2d2d] border border-[#EAF4FB] dark:border-[#404040] rounded-xl shadow-sm mb-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MdFilterList size={22} className="text-[#1E73BE]" />
                <h2 className="text-lg font-semibold text-[#22292F] dark:text-white">Filtres</h2>
              </div>
              <span className="text-sm text-[#6C757D] dark:text-[#a0a0a0] bg-[#F5F7FA] dark:bg-[#383838] px-3 py-1 rounded-full">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre par date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] dark:text-[#e0e0e0] mb-2">
                  <MdCalendarToday size={16} className="text-[#6C757D] dark:text-[#a0a0a0]" />
                  Période
                </label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] dark:border-[#404040] rounded-lg bg-white dark:bg-[#383838] text-[#22292F] dark:text-white focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Tous">Toutes les périodes</option>
                    <option value="Aujourd'hui">Aujourd'hui</option>
                    <option value="Cette Semaine">Cette semaine</option>
                    <option value="Ce Mois">Ce mois</option>
                    <option value="Cette Année">Cette année</option>
                  </select>
                  <MdCalendarToday className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] pointer-events-none" size={18} />
                </div>
              </div>

              {/* Filtre par catégorie */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] dark:text-[#e0e0e0] mb-2">
                  <MdCategory size={16} className="text-[#6C757D] dark:text-[#a0a0a0]" />
                  Catégorie
                </label>
                <div className="relative">
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] dark:border-[#404040] rounded-lg bg-white dark:bg-[#383838] text-[#22292F] dark:text-white focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Tous">Toutes les catégories</option>
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <MdCategory className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] pointer-events-none" size={18} />
                </div>
              </div>

              {/* Filtre par type */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] dark:text-[#e0e0e0] mb-2">
                  <MdSwapVert size={16} className="text-[#6C757D] dark:text-[#a0a0a0]" />
                  Type
                </label>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] dark:border-[#404040] rounded-lg bg-white dark:bg-[#383838] text-[#22292F] dark:text-white focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Tous">Tous les types</option>
                    <option value="income">💰 Revenus</option>
                    <option value="expense">💸 Dépenses</option>
                  </select>
                  <MdSwapVert className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* Bouton pour réinitialiser les filtres */}
              {(dateFilter !== 'Tous' || catFilter !== 'Tous' || typeFilter !== 'Tous') && (
              <div className="mt-4 pt-4 border-t border-[#EAF4FB] dark:border-[#404040]">
                <button
                  onClick={() => {
                    setDateFilter('Tous');
                    setCatFilter('Tous');
                    setTypeFilter('Tous');
                  }}
                  className="text-sm text-[#6C757D] dark:text-[#a0a0a0] hover:text-[#1E73BE] font-medium transition-colors flex items-center gap-2"
                >
                  <MdFilterList size={16} />
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </section>
          {/* Tableau transactions */}
          <section className="bg-white dark:bg-[#2d2d2d] border border-[#EAF4FB] dark:border-[#404040] rounded-xl p-8">
            <h2 className="text-xl font-bold text-[#22292F] dark:text-white mb-6">
              Transactions ({filtered.length} résultat{filtered.length > 1 ? 's' : ''})
            </h2>
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-[#F5F7FA] dark:bg-[#383838]">
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Date</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Description</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Catégorie</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Portefeuille</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Montant</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Type</th>
                    <th className="px-4 py-3 text-left text-[#343A40] dark:text-[#e0e0e0] font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-[#6C757D] dark:text-[#a0a0a0]">
                        Aucune transaction trouvée
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t._id} className="even:bg-white even:dark:bg-[#2d2d2d] odd:bg-[#F5F7FA] odd:dark:bg-[#383838] hover:bg-[#EAF4FB] dark:hover:bg-[#404040] transition">
                        <td className="px-4 py-3 font-medium">
                          {new Date(t.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">{t.description}</td>
                        <td className="px-4 py-3">
                          <span className="bg-[#F5F7FA] border border-[#EAF4FB] rounded px-2 py-1 text-xs text-[#343A40]">
                            {t.category?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-[#E0F2FE] border border-[#B3E5FC] rounded px-2 py-1 text-xs text-[#1E73BE]">
                            {t.wallet?.name || 'N/A'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-semibold ${
                          t.type === 'expense' ? 'text-[#DC2626]' : 'text-[#22C55E]'
                        }`}>
                          {t.type === 'income' ? '+ ' : '- '}
                          {Math.abs(t.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded px-2 py-1 text-xs font-semibold ${
                            t.type === 'expense' 
                              ? 'bg-[#FEE2E2] text-[#DC2626]' 
                              : 'bg-[#DCFCE7] text-[#22C55E]'
                          }`}>
                            {t.type === 'expense' ? 'Dépense' : 'Revenu'}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button 
                            onClick={() => handleEditTransaction(t)}
                            className="text-[#1E73BE] hover:bg-[#1E73BE] hover:text-white p-1 rounded transition"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(t._id)}
                            className="text-[#DC2626] hover:bg-[#DC2626] hover:text-white p-1 rounded transition"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4">
                <h3 className="text-xl font-bold text-[#22292F] mb-6">
                  {editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}
                </h3>
                <form onSubmit={handleAddTransaction}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      placeholder="Description de la transaction"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Montant (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      required
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Catégorie</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Portefeuille</label>
                    <select
                      value={newTransaction.wallet}
                      onChange={(e) => setNewTransaction({...newTransaction, wallet: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      required
                    >
                      <option value="">Sélectionner un portefeuille</option>
                      {wallets.map(wallet => (
                        <option key={wallet._id} value={wallet._id}>{wallet.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-[#343A40] mb-2">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 focus:border-[#1E73BE]"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingTransaction(null);
                      }}
                      className="flex-1 border border-[#EAF4FB] text-[#6C757D] py-2 px-4 rounded-lg hover:bg-[#F5F7FA] transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#22C55E] hover:bg-[#16A34A] text-white py-2 px-4 rounded-lg transition"
                    >
                      {editingTransaction ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <footer className="flex flex-col md:flex-row items-center justify-between gap-2 mt-8 text-[#6C757D] text-sm">
            <div className="flex gap-6">
              <span>MyBudget+</span>
              <Link to="/legal" className="hover:text-[#1E73BE] transition">Légal</Link>
              <Link to="/support" className="hover:text-[#1E73BE] transition">Support</Link>
            </div>
            <div className="flex gap-4 text-xl">
              <span className="hover:text-[#1E73BE] cursor-pointer transition">📘</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">🐦</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">📧</span>
              <span className="hover:text-[#1E73BE] cursor-pointer transition">💼</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
