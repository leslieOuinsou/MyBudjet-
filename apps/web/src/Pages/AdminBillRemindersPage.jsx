import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { getAllBillRemindersAdmin } from '../api.js';
import { 
  MdNotifications,
  MdSearch,
  MdRefresh,
  MdArrowBack,
  MdPerson,
  MdCalendarToday,
  MdAttachMoney
} from 'react-icons/md';

export default function AdminBillRemindersPage() {
  const { isDarkMode } = useTheme();
  
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  useEffect(() => {
    loadReminders();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh des rappels (admin)...');
      loadReminders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadReminders = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📋 Chargement des rappels...');
      const data = await getAllBillRemindersAdmin();
      console.log('✅ Rappels reçus:', data);
      
      setReminders(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('❌ Erreur chargement rappels:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredReminders = reminders.filter(reminder =>
    reminder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reminder.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reminder.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const upcomingReminders = filteredReminders.filter(r => new Date(r.dueDate) > new Date());
  const overdueReminders = filteredReminders.filter(r => new Date(r.dueDate) <= new Date());
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement des rappels...</p>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/admin" className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-gray-300 hover:bg-[#334155]' : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]'}`}>
                <MdArrowBack size={24} />
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
                  Rappels de Factures
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                  Gérez tous les rappels de factures des utilisateurs
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
              onClick={loadReminders}
              className="flex items-center gap-2 bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] transition"
            >
              <MdRefresh size={20} />
              Actualiser
            </button>
          </div>
          
          {/* Messages */}
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-300 dark:border-[#991B1B] text-red-700 dark:text-[#FCA5A5]'}`}>
              ❌ {error}
            </div>
          )}
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Total Rappels</div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>{reminders.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>À venir</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-[#60A5FA]">{upcomingReminders.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>En retard</div>
              <div className="text-2xl font-bold text-red-600 dark:text-[#F87171]">{overdueReminders.length}</div>
            </div>
          </div>
          
          {/* Recherche */}
          <div className="mb-6 relative">
            <MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`} size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#1E293B] border-[#334155] text-white placeholder-gray-500' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
            />
          </div>
          
          {/* Liste des rappels */}
          <div className="space-y-4">
            {filteredReminders.length > 0 ? (
              filteredReminders.map((reminder) => {
                const isOverdue = new Date(reminder.dueDate) <= new Date();
                const daysUntil = Math.ceil((new Date(reminder.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={reminder._id}
                    className={`p-6 rounded-lg border ${isDarkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]'} ${isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <MdNotifications size={24} className={isOverdue ? 'text-red-500 dark:text-[#F87171]' : 'text-blue-500 dark:text-[#60A5FA]'} />
                          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                            {reminder.name}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${isOverdue ? 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-700 dark:text-[#FCA5A5]' : 'bg-blue-100 dark:bg-[#1E40AF]/50 text-blue-700 dark:text-[#BFDBFE]'}`}>
                            {isOverdue ? `Retard de ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''}` : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div className="flex items-center gap-2">
                            <MdPerson size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Utilisateur</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                                {reminder.user?.name || 'N/A'}
                              </div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>
                                {reminder.user?.email || ''}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MdCalendarToday size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Date d'échéance</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                                {new Date(reminder.dueDate).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MdAttachMoney size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'} />
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>Montant</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                                {reminder.amount?.toFixed(2)} €
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {reminder.note && (
                          <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                            Note: {reminder.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`p-12 rounded-lg text-center ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
                <MdNotifications size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600 dark:text-[#CBD5E1]' : 'text-gray-400'}`} />
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Aucun rappel trouvé</div>
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`}>
                  {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucun rappel de facture enregistré'}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

