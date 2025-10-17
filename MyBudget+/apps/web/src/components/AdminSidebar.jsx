import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  MdDashboard, 
  MdPeople, 
  MdNotifications, 
  MdRepeat,
  MdHelp,
  MdSupport,
  MdLogout,
  MdPerson,
  MdSettings,
  MdMenu,
  MdClose
} from 'react-icons/md';

export default function AdminSidebar() {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const menuItems = [
    { to: '/admin', label: 'Tableau de bord', icon: MdDashboard },
    { to: '/admin/users', label: 'Utilisateurs', icon: MdPeople },
    { to: '/admin/billreminders', label: 'Rappels', icon: MdNotifications },
    { to: '/admin/recurring', label: 'Récurrentes', icon: MdRepeat },
    { to: '/admin/profile', label: 'Mon Profil', icon: MdPerson },
    { to: '/admin/settings', label: 'Paramètres', icon: MdSettings },
    { to: '/admin/support', label: 'Support', icon: MdSupport },
    { to: '/admin/faq', label: 'FAQ', icon: MdHelp },
  ];
  
  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg border"
        style={{
          backgroundColor: isDarkMode ? '#2d2d2d' : 'white',
          borderColor: isDarkMode ? '#6b21a8' : '#e5e7eb'
        }}
      >
        {mobileMenuOpen ? (
          <MdClose size={24} style={{ color: isDarkMode ? 'white' : '#1f2937' }} />
        ) : (
          <MdMenu size={24} style={{ color: isDarkMode ? 'white' : '#1f2937' }} />
        )}
      </button>
      
      {/* Overlay pour mobile */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static
        w-64 py-8 px-6 
        h-screen
        transition-transform duration-300 ease-in-out
        z-40
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isDarkMode ? 'bg-[#2d2d2d] border-r border-[#404040]' : 'bg-white border-r border-[#F5F7FA]'}
      `}>
      <div className="mb-8">
        <div className={`text-xs font-semibold mb-4 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
          ADMINISTRATION
        </div>
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                    active
                      ? isDarkMode 
                        ? 'bg-purple-900/30 text-purple-400 font-semibold border border-purple-700/50' 
                        : 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-[#383838]'
                        : 'text-[#343A40] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Bouton Déconnexion */}
      <Link
        to="/login"
        onClick={() => {
          localStorage.removeItem('token');
          setMobileMenuOpen(false);
        }}
        className="mt-8 w-full bg-[#DC3545] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#b52a37] flex items-center justify-center gap-2 transition"
      >
        <MdLogout size={20} />
        Déconnexion
      </Link>
    </aside>
    </>
  );
}

