import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { 
  getAllUsers, 
  blockUser, 
  unblockUser, 
  deleteUserAdmin,
  updateUserRole
} from '../api.js';
import { 
  MdPeople, 
  MdBlock, 
  MdCheckCircle, 
  MdDelete, 
  MdEdit,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdArrowBack,
  MdAdminPanelSettings,
  MdPerson
} from 'react-icons/md';

export default function AdminUsersPage() {
  const { isDarkMode } = useTheme();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal pour éditer le rôle
  const [editingUser, setEditingUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  useEffect(() => {
    loadUsers();
    
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh des utilisateurs (admin)...');
      loadUsers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('👥 Chargement des utilisateurs...');
      const usersData = await getAllUsers();
      console.log('✅ Utilisateurs reçus:', usersData);
      
      setUsers(usersData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBlockUser = async (userId) => {
    if (!window.confirm('Bloquer cet utilisateur ?')) return;
    
    try {
      await blockUser(userId);
      setSuccess('Utilisateur bloqué avec succès');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUnblockUser = async (userId) => {
    try {
      await unblockUser(userId);
      setSuccess('Utilisateur débloqué avec succès');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !\n\nSupprimer cet utilisateur supprimera également :\n- Toutes ses transactions\n- Tous ses budgets\n- Tous ses rappels\n- Toutes ses données\n\nÊtes-vous absolument sûr ?')) {
      return;
    }
    
    try {
      await deleteUserAdmin(userId);
      setSuccess('Utilisateur et toutes ses données supprimés');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateRole = async () => {
    if (!editingUser) return;
    
    try {
      await updateUserRole(editingUser._id, editingUser.role);
      setSuccess('Rôle mis à jour avec succès');
      setShowRoleModal(false);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && !user.blocked) ||
      (statusFilter === 'blocked' && user.blocked);
    
    return matchSearch && matchRole && matchStatus;
  });
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement des utilisateurs...</p>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin"
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#1E293B] text-gray-300 hover:bg-[#334155]' : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]'}`}
              >
                <MdArrowBack size={24} />
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
                  Gestion des Utilisateurs
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                  Gérez tous les comptes utilisateurs de la plateforme
                </p>
                <div className={`text-xs mt-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-500 dark:text-[#94A3B8]' : 'text-gray-400'}`}>
                  <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse"></span>
                  Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
                  <span className="mx-2">•</span>
                  Auto-refresh : 30s
                </div>
              </div>
            </div>
            <button 
              onClick={loadUsers}
              className="flex items-center gap-2 bg-[#1E3A8A] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition"
              disabled={loading}
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
          {success && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-[#DCFCE7] dark:bg-[#14532D]/50 border border-[#16A34A] text-[#166534] dark:text-[#86EFAC]'}`}>
              ✅ {success}
            </div>
          )}
          
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Total</div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>{users.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Actifs</div>
              <div className="text-2xl font-bold text-[#16A34A] dark:text-[#22C55E]">{users.filter(u => !u.blocked).length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Bloqués</div>
              <div className="text-2xl font-bold text-[#64748B] dark:text-[#94A3B8]">{users.filter(u => u.blocked).length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>Admins</div>
              <div className="text-2xl font-bold text-[#2563EB] dark:text-[#60A5FA]">{users.filter(u => u.role === 'admin').length}</div>
            </div>
          </div>
          
          {/* Filtres */}
          <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
            <div className="flex items-center gap-2 mb-4">
              <MdFilterList size={24} className="text-[#2563EB] dark:text-[#60A5FA]" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>Filtres</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="relative">
                <MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`} size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white placeholder-gray-500' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                />
              </div>
              
              {/* Filtre rôle */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="all" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Tous les rôles</option>
                <option value="admin" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Administrateurs</option>
                <option value="user" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Utilisateurs</option>
              </select>
              
              {/* Filtre statut */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="all" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Tous les statuts</option>
                <option value="active" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Actifs</option>
                <option value="blocked" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Bloqués</option>
              </select>
            </div>
            
            <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Tableau */}
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-[#334155]' : 'bg-gray-50 dark:bg-[#334155]/50'}>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>UTILISATEUR</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>EMAIL</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>RÔLE</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>STATUT</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>INSCRIT LE</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={isDarkMode ? 'border-b border-[#334155] hover:bg-[#334155]' : 'border-b border-gray-200 dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155]/50'}
                      >
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-semibold">
                              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </div>
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowRoleModal(true);
                            }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'admin' 
                                ? 'bg-[#1E3A8A] text-white hover:bg-[#1e40af]' 
                                : 'bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE] hover:bg-[#BFDBFE] dark:hover:bg-[#1E40AF]'
                            }`}
                          >
                            {user.role === 'admin' ? <MdAdminPanelSettings size={14} /> : <MdPerson size={14} />}
                            {user.role === 'admin' ? 'Admin' : 'User'}
                            <MdEdit size={12} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.blocked 
                              ? 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-700 dark:text-[#FCA5A5]' 
                              : 'bg-[#DCFCE7] dark:bg-[#14532D]/50 text-[#166534] dark:text-[#86EFAC]'
                          }`}>
                            {user.blocked ? 'Bloqué' : 'Actif'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.blocked ? (
                              <button 
                                onClick={() => handleUnblockUser(user._id)}
                                className="flex items-center gap-1 px-3 py-1 rounded text-sm text-[#16A34A] dark:text-[#22C55E] hover:bg-[#DCFCE7] dark:hover:bg-[#14532D]/50"
                                title="Débloquer"
                              >
                                <MdCheckCircle size={18} />
                                Débloquer
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleBlockUser(user._id)}
                                className="flex items-center gap-1 px-3 py-1 rounded text-sm text-orange-600 dark:text-[#FBBF24] hover:bg-orange-50 dark:hover:bg-[#78350F]/30"
                                title="Bloquer"
                              >
                                <MdBlock size={18} />
                                Bloquer
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="flex items-center gap-1 px-3 py-1 rounded text-sm text-red-600 dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30"
                              title="Supprimer"
                            >
                              <MdDelete size={18} />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500 dark:text-[#94A3B8]'}`}>
                        <MdPeople size={48} className="mx-auto mb-3 opacity-50" />
                        <div className="font-medium">Aucun utilisateur trouvé</div>
                        <div className="text-sm mt-1">
                          {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                            ? 'Essayez de modifier vos filtres' 
                            : 'Aucun utilisateur inscrit'}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal pour modifier le rôle */}
      {showRoleModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white dark:bg-[#1E293B]'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
              Modifier le rôle
            </h3>
            <div className="mb-4">
              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                Utilisateur: {editingUser.name} ({editingUser.email})
              </div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                Rôle
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="user" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Utilisateur</option>
                <option value="admin" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Administrateur</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateRole}
                className="flex-1 bg-[#1E3A8A] text-white px-4 py-2 rounded-lg hover:bg-[#1e40af] transition"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingUser(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#334155] text-gray-300 hover:bg-[#334155]' : 'bg-gray-200 dark:bg-[#475569] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-300 dark:hover:bg-[#475569]'}`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

