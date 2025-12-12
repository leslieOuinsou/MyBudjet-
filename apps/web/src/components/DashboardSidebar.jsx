import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MdMenu, MdClose, MdLogout } from "react-icons/md";

const menu = [
  { to: "/dashboard", label: "📊 Tableau de bord" },
  { to: "/categories", label: "🏷️ Catégories & Portefeuilles" },
  { to: "/budgets", label: "💰 Budgets" },
  { to: "/expenses", label: "💸 Dépenses" },
  { to: "/transactions", label: "💳 Transactions" },
  { to: "/reports", label: "📈 Rapports" },
  { to: "/importexport", label: "📁 Import/Export" },
  { to: "/forecasts", label: "🔮 Prévisions" },
  { to: "/notifications", label: "🔔 Notifications" },
  { to: "/settings", label: "⚙️ Paramètres utilisateur" },
  { to: "/profile", label: "👤 Mon Profil" },
];

export default function DashboardSidebar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-[#2d2d2d] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {mobileMenuOpen ? <MdClose size={24} className="text-gray-800 dark:text-white" /> : <MdMenu size={24} className="text-gray-800 dark:text-white" />}
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
        w-64 
        bg-[#fff] dark:bg-[#2d2d2d] 
        border-r border-[#F5F7FA] dark:border-[#404040] 
        py-8 px-6 
        h-screen
        transition-transform duration-300 ease-in-out
        z-40
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-8">
          <div className="text-xs text-[#6C757D] dark:text-[#a0a0a0] font-semibold mb-2">NAVIGATION</div>
          <ul className="space-y-2">
            {menu.map((item, index) => (
              <li key={`${item.to}-${index}`}>
                {item.submenu ? (
                  <div>
                    <div className="block px-2 py-1 text-[#343A40] dark:text-[#e0e0e0] font-semibold">
                      {item.label}
                    </div>
                    <ul className="ml-4 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.to}>
                          <Link
                            to={subItem.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-2 py-1 rounded transition-colors text-sm ${
                              location.pathname === subItem.to 
                                ? "bg-[#F5F7FA] dark:bg-[#383838] text-[#1E73BE] dark:text-[#60A5FA] font-semibold" 
                                : "hover:bg-[#F5F7FA] dark:hover:bg-[#383838] text-[#343A40] dark:text-[#e0e0e0]"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Link
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-2 py-1 rounded transition-colors ${
                      location.pathname === item.to 
                        ? "bg-[#F5F7FA] dark:bg-[#383838] text-[#1E73BE] dark:text-[#60A5FA] font-semibold" 
                        : "hover:bg-[#F5F7FA] dark:hover:bg-[#383838] text-[#343A40] dark:text-[#e0e0e0]"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Link 
          to="/login" 
          onClick={() => setMobileMenuOpen(false)}
          className="mt-8 w-full bg-[#DC3545] hover:bg-[#b52a37] text-white px-6 py-2 rounded font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <MdLogout size={20} /> Déconnexion
        </Link>
      </aside>
    </>
  );
}
