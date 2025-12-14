import React, { useState, useEffect } from "react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { useTheme } from '../context/ThemeContext';
import { 
  getReminders, 
  createReminder, 
  updateReminder, 
  deleteReminder,
  getCategories,
  getWallets 
} from '../api.js';
import { 
  MdNotifications, 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch,
  MdCalendarToday,
  MdAttachMoney
} from 'react-icons/md';

export default function BillRemindersPage() {
  const { isDarkMode } = useTheme();
  
  const [reminders, setReminders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dueDate: '',
    category: '',
    wallet: '',
    note: ''
  });
  
  useEffect(() => {
    loadData();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh des rappels...');
      loadData();
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [remindersData, categoriesData, walletsData] = await Promise.all([
        getReminders(),
        getCategories(),
        getWallets()
      ]);
      
      setReminders(remindersData);
      setCategories(categoriesData);
      setWallets(walletsData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('❌ Erreur chargement données:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const reminderData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category || null,
        wallet: formData.wallet || null,
        note: formData.note
      };
      
      if (editingReminder) {
        await updateReminder(editingReminder._id, reminderData);
        setSuccess('Rappel modifié avec succès !');
      } else {
        await createReminder(reminderData);
        setSuccess('Rappel créé avec succès !');
      }
      
      setShowModal(false);
      setEditingReminder(null);
      resetForm();
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      amount: reminder.amount,
      dueDate: new Date(reminder.dueDate).toISOString().split('T')[0],
      category: reminder.category?._id || '',
      wallet: reminder.wallet?._id || '',
      note: reminder.note || ''
    });
    setShowModal(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rappel ?')) return;
    
    try {
      await deleteReminder(id);
      setSuccess('Rappel supprimé avec succès !');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      dueDate: '',
      category: '',
      wallet: '',
      note: ''
    });
  };
  
  const openCreateModal = () => {
    setEditingReminder(null);
    resetForm();
    setShowModal(true);
  };
  
  // Filtrer les rappels
  const filteredReminders = reminders.filter(reminder =>
    reminder.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculer les statuts
  const getStatus = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'En retard', color: 'red' };
    if (diffDays <= 3) return { label: 'Urgent', color: 'orange' };
    return { label: 'À venir', color: 'green' };
  };
  
  const upcomingReminders = filteredReminders.filter(r => {
    const status = getStatus(r.dueDate);
    return status.color === 'green' || status.color === 'orange';
  });
  
  const overdueReminders = filteredReminders.filter(r => {
    const status = getStatus(r.dueDate);
    return status.color === 'red';
  });
  
  if (loading) {
    return (
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
        <DashboardSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
      <DashboardSidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
                Rappels de Factures
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
                Gérez vos rappels de paiement et ne manquez plus aucune échéance
              </p>
              <div className={`text-xs mt-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
                <span className="mx-2">•</span>
                Auto-refresh : 30s
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-[#1E3A8A] text-white px-6 py-3 rounded-lg hover:bg-[#1e40af] transition"
            >
              <MdAdd size={20} />
              Nouveau Rappel
            </button>
          </div>
          
          {/* Messages */}
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 border border-red-300 text-red-700'}`}>
              ❌ {error}
            </div>
          )}
          {success && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-green-100 border border-green-300 text-green-700'}`}>
              ✅ {success}
            </div>
          )}
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Rappels</div>
              <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{reminders.length}</div>
            </div>
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>À venir</div>
              <div className="text-3xl font-bold text-green-600">{upcomingReminders.length}</div>
            </div>
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>En retard</div>
              <div className="text-3xl font-bold text-[#495057]">{overdueReminders.length}</div>
            </div>
          </div>
          
          {/* Recherche */}
          <div className="mb-6 relative">
            <MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            <input
              type="text"
              placeholder="Rechercher un rappel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
            />
          </div>
          
          {/* Liste des rappels */}
          <div className="space-y-4">
            {filteredReminders.length > 0 ? (
              filteredReminders.map((reminder) => {
                const status = getStatus(reminder.dueDate);
                const daysUntil = Math.ceil((new Date(reminder.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={reminder._id}
                    className={`p-6 rounded-lg border-l-4 ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-gray-200'}`}
                    style={{ borderLeftColor: status.color === 'red' ? '#495057' : status.color === 'orange' ? '#6C757D' : '#28A745' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <MdNotifications size={24} className={status.color === 'red' ? 'text-[#495057]' : status.color === 'orange' ? 'text-[#6C757D]' : 'text-[#22C55E]'} />
                          <div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                              {reminder.name}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              status.color === 'red' ? 'bg-[#495057] text-white' :
                              status.color === 'orange' ? 'bg-[#6C757D] text-white' :
                              'bg-[#22C55E] text-white'
                            }`}>
                              {status.label} {daysUntil >= 0 ? `(${daysUntil} jour${daysUntil > 1 ? 's' : ''})` : `(${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''} de retard)`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <MdAttachMoney size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Montant</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {reminder.amount?.toFixed(2)} €
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <MdCalendarToday size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Date d'échéance</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {new Date(reminder.dueDate).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Catégorie</div>
                              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {reminder.category?.name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {reminder.note && (
                          <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Note: {reminder.note}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="p-2 text-[#1E3A8A] hover:bg-blue-50 rounded transition"
                          title="Modifier"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder._id)}
                          className="p-2 text-[#6C757D] hover:bg-gray-50 rounded transition"
                          title="Supprimer"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`p-12 rounded-lg text-center ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
                <MdNotifications size={48} className={`mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Aucun rappel trouvé</div>
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchTerm ? 'Essayez de modifier votre recherche' : 'Créez votre premier rappel pour ne plus manquer d\'échéance'}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {editingReminder ? 'Modifier le Rappel' : 'Nouveau Rappel'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date d'échéance *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    style={isDarkMode ? { colorScheme: 'dark' } : {}}
                  >
                    <option value="">Aucune</option>
                    {categories.filter(c => c.type === 'expense').map(cat => (
                      <option key={cat._id} value={cat._id} style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Portefeuille
                  </label>
                  <select
                    value={formData.wallet}
                    onChange={(e) => setFormData({...formData, wallet: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    style={isDarkMode ? { colorScheme: 'dark' } : {}}
                  >
                    <option value="">Aucun</option>
                    {wallets.map(wallet => (
                      <option key={wallet._id} value={wallet._id} style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Note
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                    rows="3"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1E3A8A] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition"
                >
                  {editingReminder ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingReminder(null);
                    resetForm();
                  }}
                  className="flex-1 bg-[#E5E7EB] text-[#374151] px-4 py-2 rounded-lg hover:bg-[#D1D5DB] transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
