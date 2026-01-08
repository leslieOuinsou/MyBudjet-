import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { 
  getTransactions, getCategories, getWallets, addTransaction, updateTransaction, deleteTransaction,
  getPayPalAuthUrl, getPayPalStatus, getPayPalBalance, getPayPalTransactions, disconnectPayPal, handlePayPalCallback
} from '../api.js';
import { 
  MdSearch, MdAdd, MdFilterList, MdCalendarToday, 
  MdCategory, MdSwapVert, MdTrendingUp, MdTrendingDown,
  MdEdit, MdDelete, MdAccountBalance, MdRefresh
} from 'react-icons/md';

export default function TransactionsPage() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // États PayPal
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [paypalBalance, setPaypalBalance] = useState(null);
  const [paypalTransactions, setPaypalTransactions] = useState([]);
  const [paypalLoading, setPaypalLoading] = useState(false);
  
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
    checkPayPalStatus();
    
    // Gérer le callback PayPal
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code) {
      handleCallback(code);
    } else if (error) {
      setError('❌ Erreur d\'autorisation PayPal: ' + error);
    }
  }, [searchParams]);

  const checkPayPalStatus = async () => {
    try {
      const status = await getPayPalStatus();
      setPaypalConnected(status.isConnected);
      if (status.isConnected) {
        await loadPayPalData();
      }
    } catch (err) {
      console.log('PayPal non connecté');
      setPaypalConnected(false);
    }
  };

  const loadPayPalData = async () => {
    try {
      setPaypalLoading(true);
      console.log('🔄 Chargement des données PayPal...');
      
      const [balanceResult, transactionsResult] = await Promise.all([
        getPayPalBalance(),
        getPayPalTransactions()
      ]);
      
      console.log('💰 Solde PayPal reçu:', balanceResult);
      console.log('📋 Transactions PayPal reçues:', transactionsResult);
      
      setPaypalBalance(balanceResult);
      setPaypalTransactions(transactionsResult.transactions || []);
      
      console.log('✅ Données PayPal chargées:', {
        balance: balanceResult,
        transactionsCount: (transactionsResult.transactions || []).length
      });
    } catch (err) {
      console.error('❌ Erreur chargement PayPal:', err);
      setError('Erreur lors du chargement des données PayPal: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setPaypalLoading(false);
    }
  };

  const handlePayPalConnect = async () => {
    try {
      setPaypalLoading(true);
      const { authUrl } = await getPayPalAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Erreur connexion PayPal: ' + (err.message || 'Erreur inconnue'));
      setPaypalLoading(false);
    }
  };

  const handleCallback = async (code) => {
    try {
      setPaypalLoading(true);
      setError('');
      console.log('🔄 Traitement du code PayPal...');
      const result = await handlePayPalCallback(code);
      setSuccess('✅ PayPal connecté avec succès !');
      setPaypalConnected(true);
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, '/transactions');
      
      // Recharger les données PayPal
      await loadPayPalData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('❌ Erreur lors de la connexion: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setPaypalLoading(false);
    }
  };

  const handlePayPalDisconnect = async () => {
    if (!confirm('Voulez-vous déconnecter PayPal ?')) return;
    
    try {
      setPaypalLoading(true);
      await disconnectPayPal();
      setPaypalConnected(false);
      setPaypalBalance(null);
      setPaypalTransactions([]);
      setSuccess('PayPal déconnecté avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur déconnexion PayPal: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setPaypalLoading(false);
    }
  };

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
      console.log('✅ Données actualisées:', { 
        transactions: transactionsData.length, 
        categories: categoriesData.length, 
        wallets: walletsData.length 
      });
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
      
      // Validation des champs requis
      if (!newTransaction.description || !newTransaction.description.trim()) {
        setError('La description est requise');
        return;
      }
      
      if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
        setError('Le montant doit être supérieur à 0');
        return;
      }
      
      if (!newTransaction.category) {
        setError('Veuillez sélectionner une catégorie');
        return;
      }
      
      if (!newTransaction.wallet) {
        setError('Veuillez sélectionner un portefeuille');
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
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      setShowModal(false);
      setEditingTransaction(null);
      loadData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Erreur lors de la sauvegarde de la transaction:', err);
      const errorMessage = err.message || 'Erreur lors de la sauvegarde de la transaction';
      setError(errorMessage);
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

  // Combiner les transactions normales et PayPal
  const allTransactions = [...transactions];
  
  // Ajouter les transactions PayPal si connecté
  if (paypalConnected && paypalTransactions.length > 0) {
    console.log('🔄 Ajout des transactions PayPal:', paypalTransactions.length);
    const paypalTransactionsFormatted = paypalTransactions.map(tx => {
      console.log('📋 Transaction PayPal formatée:', tx);
      return {
        _id: tx.id || `paypal-${tx.transaction_info?.transaction_id || Math.random()}`,
        description: tx.description || tx.transaction_info?.transaction_note || 'Transaction PayPal',
        amount: Math.abs(parseFloat(tx.amount || tx.transaction_info?.transaction_amount?.value || 0)),
        type: tx.type || ((tx.amount || tx.transaction_info?.transaction_amount?.value || 0) >= 0 ? 'income' : 'expense'),
        date: tx.date || tx.transaction_info?.transaction_initiation_date || new Date(),
        category: { name: 'PayPal 💰', color: '#0070BA' },
        wallet: { name: 'PayPal Wallet' },
        isPayPal: true,
        status: tx.status || tx.transaction_info?.transaction_status || 'completed'
      };
    });
    allTransactions.push(...paypalTransactionsFormatted);
    console.log('✅ Total transactions (normales + PayPal):', allTransactions.length);
  }

  const filtered = allTransactions.filter(t => {
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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main */}
        <main className="flex-1 px-3 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-10 flex flex-col pt-16 md:pt-10">
          {/* Messages d'erreur et succès */}
          {error && (
            <div className="mb-6 bg-[#F8D7DA] border border-[#F5C6CB] text-[#721C24] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 bg-[#D4EDDA] border border-[#C3E6CB] text-[#155724] px-4 py-3 rounded-lg">
              {success}
            </div>
          )}
          
          <div className="mb-4 md:mb-6">
            {/* Header avec titre et bouton PayPal */}
            <div className="flex flex-col gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex flex-row justify-between items-center flex-wrap gap-3 md:gap-4">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#22292F] m-0">Transactions</h1>
                
                {/* Section PayPal */}
                <button
                  onClick={handlePayPalConnect}
                  disabled={paypalLoading}
                  className="flex items-center gap-2 bg-[#1E3A8A] text-white px-3 md:px-4 py-2 rounded-lg border-none cursor-pointer text-xs md:text-sm font-semibold hover:bg-[#1e40af] transition-colors disabled:bg-[#9CA3AF]"
                >
                  <MdAccountBalance className="text-base md:text-lg" />
                  <span className="hidden sm:inline">{paypalLoading ? 'Connexion...' : 'Se connecter avec PayPal'}</span>
                  <span className="sm:hidden">PayPal</span>
                </button>
              </div>
              
              {/* Barre de recherche et filtres */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C757D] text-base md:text-lg" size={20} />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="w-full px-3 md:px-4 pl-9 md:pl-10 py-2 border border-[#EAF4FB] rounded-lg bg-[#F9FAFB] text-[#22292F] text-sm md:text-base focus:outline-none focus:border-[#1E73BE]"
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
                  className="bg-[#22C55E] text-white px-3 md:px-4 py-2 rounded-lg border-none cursor-pointer text-xs md:text-sm font-semibold flex items-center gap-2 hover:bg-[#16A34A] transition-colors w-full sm:w-auto justify-center"
                >
                  <MdAdd className="text-base md:text-lg" size={20} />
                  <span className="hidden sm:inline">Ajouter une transaction</span>
                  <span className="sm:hidden">Ajouter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-[#D4EDDA] border border-[#22C55E] text-[#155724] rounded-lg">
              {success}
            </div>
          )}
          {/* Filtres */}
          <section className="bg-white border border-[#EAF4FB] rounded-xl shadow-sm mb-4 md:mb-6 lg:mb-8 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <div className="flex items-center gap-2">
                <MdFilterList size={20} className="text-[#1E73BE] md:size-[22px]" />
                <h2 className="text-base md:text-lg font-semibold text-[#22292F]">Filtres</h2>
              </div>
              <span className="text-xs md:text-sm text-[#6C757D] bg-[#F5F7FA] px-2 md:px-3 py-1 rounded-full">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {/* Filtre par date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] mb-2">
                  <MdCalendarToday size={16} className="text-[#6C757D]" />
                  Période
                </label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] rounded-lg bg-white text-[#22292F] focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
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
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] mb-2">
                  <MdCategory size={16} className="text-[#6C757D]" />
                  Catégorie
                </label>
                <div className="relative">
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] rounded-lg bg-white text-[#22292F] focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
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
                <label className="flex items-center gap-2 text-sm font-medium text-[#343A40] mb-2">
                  <MdSwapVert size={16} className="text-[#6C757D]" />
                  Type
                </label>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#EAF4FB] rounded-lg bg-white text-[#22292F] focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-[#1E73BE]/20 transition-all appearance-none cursor-pointer"
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
              <div className="mt-4 pt-4 border-t border-[#EAF4FB]">
                <button
                  onClick={() => {
                    setDateFilter('Tous');
                    setCatFilter('Tous');
                    setTypeFilter('Tous');
                  }}
                  className="text-sm text-[#6C757D] hover:text-[#1E73BE] font-medium transition-colors flex items-center gap-2"
                >
                  <MdFilterList size={16} />
                  Réinitialiser tous les filtres
                </button>
              </div>
            )}
          </section>
                     {/* Tableau transactions */}
           <section className="bg-white border border-[#EAF4FB] rounded-xl p-4 md:p-6 lg:p-8">
             <h2 className="text-lg md:text-xl font-bold text-[#22292F] mb-4 md:mb-6">
               Transactions ({filtered.length} résultat{filtered.length > 1 ? 's' : ''})
             </h2>
             <div className="overflow-x-auto rounded-xl">
               <table className="min-w-full text-xs md:text-sm lg:text-base">
                 <thead>
                   <tr className="bg-[#F5F7FA]">
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm">Date</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm">Description</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm hidden md:table-cell">Catégorie</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm hidden lg:table-cell">Portefeuille</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm">Montant</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm hidden lg:table-cell">Type</th>
                     <th className="px-2 md:px-4 py-2 md:py-3 text-left text-[#343A40] font-bold text-xs md:text-sm">Actions</th>
                   </tr>
                 </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-[#6C757D]">
                        Aucune transaction trouvée
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t._id} className="even:bg-white odd:bg-[#F5F7FA] hover:bg-[#EAF4FB] transition">
                        <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm">
                          {new Date(t.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm truncate max-w-[150px] md:max-w-none">{t.description}</td>
                        <td className="px-2 md:px-4 py-2 md:py-3 hidden md:table-cell">
                          <span className="bg-[#F5F7FA] border border-[#EAF4FB] rounded px-2 py-1 text-[10px] md:text-xs text-[#343A40]">
                            {t.category?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                          <span className="bg-[#E0F2FE] border border-[#B3E5FC] rounded px-2 py-1 text-[10px] md:text-xs text-[#1E73BE]">
                            {t.wallet?.name || 'N/A'}
                          </span>
                        </td>
                        <td className={`px-2 md:px-4 py-2 md:py-3 font-semibold text-xs md:text-sm ${
                          t.type === 'expense' ? 'text-[#374151]' : 'text-[#22C55E]'
                        }`}>
                          {t.type === 'income' ? '+ ' : '- '}
                          {Math.abs(t.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 hidden lg:table-cell">
                          <span className={`rounded px-2 py-1 text-[10px] md:text-xs font-semibold ${
                            t.type === 'expense' 
                              ? 'bg-[#F5F7FA] text-[#374151]' 
                              : 'bg-[#DCFCE7] text-[#22C55E]'
                          }`}>
                            {t.type === 'expense' ? 'Dépense' : 'Revenu'}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 flex gap-1 md:gap-2">
                          <button 
                            onClick={() => handleEditTransaction(t)}
                            className="text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white p-1 md:p-1.5 rounded transition text-sm md:text-base"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(t._id)}
                            className="text-[#DC2626] hover:bg-[#DC2626] hover:text-white p-1 md:p-1.5 rounded transition text-sm md:text-base"
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
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-xl p-6 md:p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                 <h3 className="text-lg md:text-xl font-bold text-[#22292F] mb-4 md:mb-6">
                   {editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}
                 </h3>
                <form onSubmit={handleAddTransaction}>
                  <div className="mb-3 md:mb-4">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Description</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      placeholder="Description de la transaction"
                      required
                    />
                  </div>
                  
                  <div className="mb-3 md:mb-4">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Montant (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="mb-3 md:mb-4">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Type</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      required
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                  
                  <div className="mb-3 md:mb-4">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Catégorie</label>
                    <select
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3 md:mb-4">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Portefeuille</label>
                    <select
                      value={newTransaction.wallet}
                      onChange={(e) => setNewTransaction({...newTransaction, wallet: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      required
                    >
                      <option value="">Sélectionner un portefeuille</option>
                      {wallets.map(wallet => (
                        <option key={wallet._id} value={wallet._id}>{wallet.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4 md:mb-6">
                    <label className="block text-xs md:text-sm font-medium text-[#343A40] mb-2">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="w-full border border-[#EAF4FB] rounded-lg px-3 py-2 text-sm md:text-base bg-white text-[#22292F] focus:border-[#1E73BE]"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingTransaction(null);
                      }}
                      className="flex-1 bg-[#E5E7EB] text-[#374151] py-2.5 md:py-2 px-4 rounded-lg hover:bg-[#D1D5DB] transition text-sm md:text-base"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#1E3A8A] hover:bg-[#1e40af] text-white py-2.5 md:py-2 px-4 rounded-lg transition text-sm md:text-base"
                    >
                      {editingTransaction ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
