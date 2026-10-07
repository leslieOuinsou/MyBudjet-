import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-[#475569] animate-pulse"></div>
      );
    }

    if (user?.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#1E3A8A]"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] dark:to-[#2563EB] text-white flex items-center justify-center font-bold text-sm border-2 border-[#1E3A8A]">
        {getInitials(user?.name)}
      </div>
    );
  };

  return (
    <header className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex items-center justify-between border-b bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155]">
      {/* Logo/Titre */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="p-1.5 md:p-2 bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] dark:to-[#2563EB] rounded-lg">
          <MdAdminPanelSettings size={20} className="text-white md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-sm md:text-base lg:text-lg font-bold text-black dark:text-[#F8FAFC]">
            Administration MyBudget+
          </h2>
          <p className="text-xs hidden sm:block text-gray-500 dark:text-[#94A3B8]">
            Panneau de contrôle administrateur
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Lien Dashboard utilisateur */}
        <Link
          to="/dashboard"
          className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 rounded-lg transition bg-gray-100 dark:bg-[#334155] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-200 dark:hover:bg-[#475569]"
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
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-gray-100 dark:hover:bg-[#334155]"
          >
            <UserAvatar />
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold flex items-center gap-2 text-black dark:text-[#F8FAFC]">
                {user?.name || 'Admin'}
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-[#1E40AF]/50 text-[#1E3A8A] dark:text-[#BFDBFE] text-xs rounded-full font-bold">
                  ADMIN
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-[#94A3B8]">
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
              <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-20 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-[#334155]">
                  <div className="text-sm font-semibold text-black dark:text-[#F8FAFC]">
                    {user?.name || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[#94A3B8]">
                    {user?.email || ''}
                  </div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-[#1E40AF]/50 text-[#1E3A8A] dark:text-[#BFDBFE] text-xs rounded-full font-bold">
                      Administrateur
                    </span>
                  </div>
                </div>
                
                <div className="py-2">
                  <Link
                    to="/admin/profile"
                    className="flex items-center gap-3 px-4 py-2 transition text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdPerson size={18} />
                    <span className="text-sm">Mon Profil Admin</span>
                  </Link>
                  
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-3 px-4 py-2 transition text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdSettings size={18} />
                    <span className="text-sm">Paramètres Admin</span>
                  </Link>
                  
                  <div className="my-2 border-t border-gray-200 dark:border-[#334155]"></div>
                  
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-2 transition text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdAdminPanelSettings size={18} />
                    <span className="text-sm">Admin Dashboard</span>
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-2 transition text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <MdDashboard size={18} />
                    <span className="text-sm">Dashboard Utilisateur</span>
                  </Link>
                </div>
                
                <div className="border-t py-2 border-gray-200 dark:border-[#334155]">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30 transition"
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

