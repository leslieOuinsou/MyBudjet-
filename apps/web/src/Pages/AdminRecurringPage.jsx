import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { getAllRecurringTransactionsAdmin } from '../api.js';
import { 
  MdRepeat,
  MdSearch,
  MdRefresh,
  MdArrowBack,
  MdPerson,
  MdCalendarToday,
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney
} from 'react-icons/md';

export default function AdminRecurringPage() {
  const { isDarkMode } = useTheme();
  
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  useEffect(() => {
    loadRecurring();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh des transactions récurrentes (admin)...');
      loadRecurring();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadRecurring = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Chargement des transactions récurrentes...');
      const data = await getAllRecurringTransactionsAdmin();
      console.log('✅ Transactions récurrentes reçues:', data);
      
      setRecurring(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('❌ Erreur chargement transactions récurrentes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredRecurring = recurring.filter(rec => {
    const matchSearch = 
      rec.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = typeFilter === 'all' || rec.type === typeFilter;
    
    return matchSearch && matchType;
  });
  
  const getFrequencyLabel = (freq) => {
    const labels = {
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      yearly: 'Annuel'
    };
    return labels[freq] || freq;
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement des transactions récurrentes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
      <AdminHeader />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        {/* Main Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/admin" className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-gray-300 hover:bg-[#334155]' : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]'}`}>
                <MdArrowBack size={24} />
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
                  Transactions Récurrentes
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                  Gérez toutes les transactions automatiques
                </p>
                <div className={`text-xs mt-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
                  <span className="mx-2">•</span>
                  Auto-refresh : 30s
                </div>
              </div>
            </div>
            <button 
              onClick={loadRecurring}
              className="flex items-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition"
            >
              <MdRefresh size={20} />
              Actualiser
            </button>
          </div>
          
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-300 dark:border-[#991B1B] text-red-700 dark:text-[#FCA5A5]'}`}>
              ❌ {error}
            </div>
          )}
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Total</div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>{recurring.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Revenus</div>
              <div className="text-2xl font-bold text-green-600 dark:text-[#22C55E]">{recurring.filter(r => r.type === 'income').length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Dépenses</div>
              <div className="text-2xl font-bold text-red-600 dark:text-[#F87171]">{recurring.filter(r => r.type === 'expense').length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Impact mensuel</div>
              <div className={`text-2xl font-bold ${recurring.filter(r => r.frequency === 'monthly').reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0) >= 0 ? 'text-green-600 dark:text-[#22C55E]' : 'text-red-600 dark:text-[#F87171]'}`}>
                {recurring.filter(r => r.frequency === 'monthly').reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0).toFixed(0)} €
              </div>
            </div>
          </div>
          
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`} size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#1E293B] border-[#334155] text-white placeholder-gray-500' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#1E293B] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
              style={isDarkMode ? { colorScheme: 'dark' } : {}}
            >
              <option value="all" style={isDarkMode ? { backgroundColor: '#1E293B', color: 'white' } : {}}>Tous les types</option>
              <option value="income" style={isDarkMode ? { backgroundColor: '#1E293B', color: 'white' } : {}}>Revenus</option>
              <option value="expense" style={isDarkMode ? { backgroundColor: '#1E293B', color: 'white' } : {}}>Dépenses</option>
            </select>
          </div>
          
          {/* Liste */}
          <div className="space-y-4">
            {filteredRecurring.length > 0 ? (
              filteredRecurring.map((rec) => (
                <div
                  key={rec._id}
                  className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {rec.type === 'income' ? (
                          <MdTrendingUp size={24} className="text-green-500" />
                        ) : (
                          <MdTrendingDown size={24} className="text-red-500 dark:text-[#F87171]" />
                        )}
                        <div>
                          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                            {rec.category?.name || 'Sans catégorie'}
                          </h3>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                            {getFrequencyLabel(rec.frequency)}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-bold ${rec.type === 'income' ? 'bg-green-100 dark:bg-[#14532D]/50 text-green-700 dark:text-[#4ADE80]' : 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-700 dark:text-[#FCA5A5]'}`}>
                          {rec.type === 'income' ? 'Revenu' : 'Dépense'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <MdPerson size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                          <div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Utilisateur</div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                              {rec.user?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MdAttachMoney size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                          <div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Montant</div>
                            <div className={`text-sm font-medium ${rec.type === 'income' ? 'text-green-600 dark:text-[#22C55E]' : 'text-red-600 dark:text-[#F87171]'}`}>
                              {rec.type === 'income' ? '+' : '-'}{rec.amount?.toFixed(2)} €
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MdCalendarToday size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                          <div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Prochaine exécution</div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                              {new Date(rec.nextDate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MdRepeat size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                          <div>
                            <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Portefeuille</div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                              {rec.wallet?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {rec.note && (
                        <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                          Note: {rec.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-12 rounded-lg text-center ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
                <MdRepeat size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600 dark:text-[#CBD5E1]' : 'text-gray-400'}`} />
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Aucune transaction récurrente</div>
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`}>
                  {searchTerm || typeFilter !== 'all' ? 'Essayez de modifier vos filtres' : 'Aucune transaction récurrente enregistrée'}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

