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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
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
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] text-gray-300 hover:bg-[#383838]' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <MdArrowBack size={24} />
              </Link>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
                  Gestion des Utilisateurs
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
                  Gérez tous les comptes utilisateurs de la plateforme
                </p>
                <div className={`text-xs mt-2 flex items-center gap-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
                  <span className="mx-2">•</span>
                  Auto-refresh : 30s
                </div>
              </div>
            </div>
            <button 
              onClick={loadUsers}
              className="flex items-center gap-2 bg-[#1E73BE] text-white px-4 py-2 rounded-lg hover:bg-[#155a8a] transition"
              disabled={loading}
            >
              <MdRefresh size={20} />
              Actualiser
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
          
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{users.length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Actifs</div>
              <div className="text-2xl font-bold text-[#28A745]">{users.filter(u => !u.blocked).length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bloqués</div>
              <div className="text-2xl font-bold text-[#6C757D]">{users.filter(u => u.blocked).length}</div>
            </div>
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admins</div>
              <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'admin').length}</div>
            </div>
          </div>
          
          {/* Filtres */}
          <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-4">
              <MdFilterList size={24} className="text-[#1E73BE]" />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>Filtres</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div className="relative">
                <MdSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                />
              </div>
              
              {/* Filtre rôle */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="all" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Tous les rôles</option>
                <option value="admin" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Administrateurs</option>
                <option value="user" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Utilisateurs</option>
              </select>
              
              {/* Filtre statut */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="all" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Tous les statuts</option>
                <option value="active" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Actifs</option>
                <option value="blocked" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Bloqués</option>
              </select>
            </div>
            
            <div className={`mt-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
            </div>
          </div>
          
          {/* Tableau */}
          <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className={isDarkMode ? 'bg-[#383838]' : 'bg-gray-50'}>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>UTILISATEUR</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>EMAIL</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>RÔLE</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>STATUT</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>INSCRIT LE</th>
                    <th className={`px-6 py-4 text-left text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={isDarkMode ? 'border-b border-[#404040] hover:bg-[#383838]' : 'border-b border-gray-200 hover:bg-gray-50'}
                      >
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1E73BE] text-white flex items-center justify-center font-semibold">
                              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </div>
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
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
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {user.blocked ? 'Bloqué' : 'Actif'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {user.blocked ? (
                              <button 
                                onClick={() => handleUnblockUser(user._id)}
                                className="flex items-center gap-1 px-3 py-1 rounded text-sm text-green-600 hover:bg-green-50"
                                title="Débloquer"
                              >
                                <MdCheckCircle size={18} />
                                Débloquer
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleBlockUser(user._id)}
                                className="flex items-center gap-1 px-3 py-1 rounded text-sm text-orange-600 hover:bg-orange-50"
                                title="Bloquer"
                              >
                                <MdBlock size={18} />
                                Bloquer
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteUser(user._id)}
                              className="flex items-center gap-1 px-3 py-1 rounded text-sm text-red-600 hover:bg-red-50"
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
                      <td colSpan="6" className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Modifier le rôle
            </h3>
            <div className="mb-4">
              <div className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Utilisateur: {editingUser.name} ({editingUser.email})
              </div>
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Rôle
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                style={isDarkMode ? { colorScheme: 'dark' } : {}}
              >
                <option value="user" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Utilisateur</option>
                <option value="admin" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Administrateur</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateRole}
                className="flex-1 bg-[#1E73BE] text-white px-4 py-2 rounded-lg hover:bg-[#155a8a] transition"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingUser(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-[#383838] text-gray-300 hover:bg-[#404040]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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

