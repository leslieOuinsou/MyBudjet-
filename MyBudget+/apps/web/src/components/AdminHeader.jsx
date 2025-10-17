import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getCurrentUser } from '../api';
import NotificationBell from './NotificationBell';
import { 
  MdAdminPanelSettings, 
  MdPerson, 
  MdSettings,
  MdLogout,
  MdDashboard
} from 'react-icons/md';

export default function AdminHeader() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('❌ Erreur chargement utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const UserAvatar = () => {
    if (loading) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
      );
    }

    if (user?.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-bold text-sm border-2 border-purple-400">
        {getInitials(user?.name)}
      </div>
    );
  };

  return (
    <header className={`px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between border-b ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-gray-200'}`}>
      {/* Logo/Titre */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg">
          <MdAdminPanelSettings size={20} className="text-white md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className={`text-sm md:text-base lg:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Administration MyBudget+
          </h2>
          <p className={`text-xs hidden sm:block ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Panneau de contrôle administrateur
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Lien Dashboard utilisateur */}
        <Link
          to="/dashboard"
          className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg transition ${isDarkMode ? 'bg-[#383838] text-gray-300 hover:bg-[#404040]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          title="Retour au dashboard utilisateur"
        >
          <MdDashboard size={18} />
          <span className="text-sm font-medium hidden lg:inline">Dashboard User</span>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Profil Admin */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isDarkMode ? 'hover:bg-[#383838]' : 'hover:bg-gray-100'}`}
          >
            <UserAvatar />
            <div className="hidden md:block text-left">
              <div className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {user?.name || 'Admin'}
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                  ADMIN
                </span>
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.email || ''}
              </div>
            </div>
          </button>

          {/* Menu déroulant */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
                <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-[#404040]' : 'border-gray-200'}`}>
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {user?.name || 'Admin'}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email || ''}
                  </div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                      Administrateur
                    </span>
                  </div>
                </div>
                
                <div className="py-2">
                  <Link
                    to="/admin/profile"
                    className={`flex items-center gap-3 px-4 py-2 transition ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdPerson size={18} />
                    <span className="text-sm">Mon Profil Admin</span>
                  </Link>
                  
                  <Link
                    to="/admin/settings"
                    className={`flex items-center gap-3 px-4 py-2 transition ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdSettings size={18} />
                    <span className="text-sm">Paramètres Admin</span>
                  </Link>
                  
                  <div className={`my-2 border-t ${isDarkMode ? 'border-[#404040]' : 'border-gray-200'}`}></div>
                  
                  <Link
                    to="/admin"
                    className={`flex items-center gap-3 px-4 py-2 transition ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdAdminPanelSettings size={18} />
                    <span className="text-sm">Admin Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-4 py-2 transition ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdDashboard size={18} />
                    <span className="text-sm">Dashboard Utilisateur</span>
                  </Link>
                </div>
                
                <div className={`border-t py-2 ${isDarkMode ? 'border-[#404040]' : 'border-gray-200'}`}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 transition"
                  >
                    <MdLogout size={18} />
                    <span className="text-sm font-medium">Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

