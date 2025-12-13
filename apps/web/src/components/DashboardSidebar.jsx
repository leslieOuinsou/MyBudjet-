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
  MdPerson
} from "react-icons/md";

const menu = [
  { to: "/dashboard", label: "Tableau de bord", icon: MdDashboard },
  { to: "/categories", label: "Catégories & Portefeuilles", icon: MdCategory },
  { to: "/budgets", label: "Budgets", icon: MdAccountBalance },
  { to: "/expenses", label: "Dépenses", icon: MdShoppingCart },
  { to: "/transactions", label: "Transactions", icon: MdReceipt },
  { to: "/reports", label: "Rapports", icon: MdBarChart },
  { to: "/importexport", label: "Import/Export", icon: MdFolder },
  { to: "/forecasts", label: "Prévisions", icon: MdTrendingUp },
  { to: "/notifications", label: "Notifications", icon: MdNotifications },
  { to: "/settings", label: "Paramètres", icon: MdSettings },
  { to: "/profile", label: "Mon Profil", icon: MdPerson },
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
        py-6 px-4
        h-screen
        overflow-y-auto
        transition-all duration-300 ease-in-out
        z-40
        shadow-lg md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className="mb-8 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E73BE] to-[#155a8a] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
              <MdDashboard className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#1E73BE] to-[#155a8a] bg-clip-text text-transparent">
                MyBudget+
              </h2>
              <p className="text-xs text-gray-500">Gestion financière</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
            Navigation
          </div>
          <ul className="space-y-1">
            {menu.map((item) => {
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
                          ? "bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white shadow-lg shadow-blue-500/30"
                          : "text-gray-700 hover:bg-gray-100 hover:text-[#1E73BE]"
                      }
                    `}
                  >
                    {/* Indicateur actif */}
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}
                    
                    {/* Icône */}
                    <Icon 
                      size={22} 
                      className={`
                        transition-transform duration-200
                        ${active ? "text-white" : "text-gray-500 group-hover:text-[#1E73BE]"}
                        ${active ? "" : "group-hover:scale-110"}
                      `}
                    />
                    
                    {/* Label */}
                    <span className={`
                      font-medium text-sm
                      ${active ? "text-white font-semibold" : "text-gray-700"}
                    `}>
                      {item.label}
                    </span>
                    
                    {/* Effet hover */}
                    {!active && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#1E73BE]/0 to-[#1E73BE]/0 group-hover:from-[#1E73BE]/5 group-hover:to-transparent transition-all duration-200"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Section déconnexion */}
        <div className="mt-auto pt-6 px-2 border-t border-gray-200">
          <Link 
            to="/login" 
            onClick={() => {
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');
              setMobileMenuOpen(false);
            }}
            className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            <MdLogout size={20} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Déconnexion</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
