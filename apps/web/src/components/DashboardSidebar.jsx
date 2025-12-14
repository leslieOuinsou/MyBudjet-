import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  MdMenu, 
  MdClose, 
  MdLogout,
  MdDashboard,
  MdCategory,
  MdAccountBalance,
  MdShoppingCart,
  MdReceipt,
  MdBarChart,
  MdFolder,
  MdTrendingUp,
  MdNotifications,
  MdSettings,
  MdPerson,
  MdRepeat,
  MdEventNote
} from "react-icons/md";

// Organisation des menus en sections logiques
const menuSections = [
  {
    title: "Vue d'ensemble",
    items: [
      { to: "/dashboard", label: "Tableau de bord", icon: MdDashboard },
    ]
  },
  {
    title: "Gestion financière",
    items: [
      { to: "/transactions", label: "Transactions", icon: MdReceipt },
      { to: "/expenses", label: "Dépenses", icon: MdShoppingCart },
      { to: "/budgets", label: "Budgets", icon: MdAccountBalance },
      { to: "/categories", label: "Catégories & Portefeuilles", icon: MdCategory },
      { to: "/recurring", label: "Transactions récurrentes", icon: MdRepeat },
      { to: "/bills", label: "Rappels de factures", icon: MdEventNote },
    ]
  },
  {
    title: "Analyse & Rapports",
    items: [
      { to: "/reports", label: "Rapports", icon: MdBarChart },
      { to: "/forecasts", label: "Prévisions", icon: MdTrendingUp },
      { to: "/importexport", label: "Import/Export", icon: MdFolder },
    ]
  },
  {
    title: "Paramètres",
    items: [
      { to: "/notifications", label: "Notifications", icon: MdNotifications },
      { to: "/profile", label: "Mon Profil", icon: MdPerson },
      { to: "/settings", label: "Paramètres", icon: MdSettings },
    ]
  }
];

export default function DashboardSidebar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
      >
        {mobileMenuOpen ? (
          <MdClose size={24} className="text-gray-800" />
        ) : (
          <MdMenu size={24} className="text-gray-800" />
        )}
      </button>
      
      {/* Overlay pour mobile */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static
        w-72
        bg-gradient-to-b from-white to-gray-50
        border-r border-gray-200
        h-screen
        overflow-y-auto
        transition-all duration-300 ease-in-out
        z-40
        shadow-lg md:shadow-none
        flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className="px-6 py-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-[#1E3A8A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
              <MdDashboard className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E3A8A]">
                MyBudget+
              </h2>
              <p className="text-xs text-gray-500">Gestion financière</p>
            </div>
          </Link>
        </div>

        {/* Navigation - Utilise flex-1 pour occuper tout l'espace disponible */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8" : ""}>
              {/* Titre de section */}
              <div className="text-xs font-semibold text-[#374151] uppercase tracking-wider mb-3 px-3">
                {section.title}
              </div>
              
              {/* Items de la section */}
              <ul className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          group relative flex items-center gap-3 px-4 py-3 rounded-xl
                          transition-all duration-200 ease-in-out
                          ${
                            active
                              ? "bg-[#1E3A8A] text-white shadow-md"
                              : "text-gray-700 hover:bg-gray-100 hover:text-[#1E3A8A]"
                          }
                        `}
                      >
                        {/* Indicateur actif */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                        )}
                        
                        {/* Icône */}
                        <Icon 
                          size={20} 
                          className={`
                            transition-transform duration-200 flex-shrink-0
                            ${active ? "text-white" : "text-gray-500 group-hover:text-[#1E3A8A]"}
                            ${active ? "" : "group-hover:scale-110"}
                          `}
                        />
                        
                        {/* Label */}
                        <span className={`
                          font-medium text-sm flex-1
                          ${active ? "text-white font-semibold" : "text-gray-700"}
                        `}>
                          {item.label}
                        </span>
                        
                        {/* Effet hover */}
                        {!active && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1E3A8A]/0 to-[#1E3A8A]/0 group-hover:from-[#1E3A8A]/5 group-hover:to-transparent transition-all duration-200"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Espacement avant le bouton de déconnexion */}
        <div className="flex-1 min-h-[60px]"></div>

        {/* Section déconnexion - Fixée en bas avec espacement */}
        <div className="px-4 pt-6 pb-6 border-t border-gray-200 bg-white mt-auto">
          <Link 
            to="/login" 
            onClick={() => {
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
              setMobileMenuOpen(false);
            }}
            className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#374151] hover:bg-[#1f2937] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            <MdLogout size={20} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Déconnexion</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
