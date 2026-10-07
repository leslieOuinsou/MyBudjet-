import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, getDemoStatus, removeDemoData } from "../api.js";
import { manualInstallHint, promptInstall, useCanInstall, useIsInstalled } from "../lib/install.js";
import ThemeSwitch from "./ThemeSwitch.jsx";
import PrivacyToggle from "./PrivacyToggle.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { 
  MdMenu, 
  MdClose, 
  MdLogout,
  MdInstallDesktop,
  MdScience,
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
  MdEventNote,
  MdGroup,
  MdInsights,
  MdEmojiEvents,
  MdUnfoldMore,
  MdFolderOpen,
  MdHistory,
  MdHelpOutline
} from "react-icons/md";

// Organisation des menus en sections logiques
const menuSections = [
  {
    title: 'nav.overview',
    items: [
      { to: "/dashboard", label: 'nav.dashboard', icon: MdDashboard },
    ]
  },
  {
    title: 'nav.finance',
    items: [
      { to: "/transactions", label: 'nav.transactions', icon: MdReceipt },
      { to: "/expenses", label: 'nav.expenses', icon: MdShoppingCart },
      { to: "/shared", label: 'nav.shared', icon: MdGroup },
      { to: "/budgets", label: 'nav.budgets', icon: MdAccountBalance },
      { to: "/categories", label: 'nav.categories', icon: MdCategory },
      { to: "/bills", label: 'nav.bills', icon: MdEventNote },
      { to: "/recurring", label: 'nav.recurring', icon: MdRepeat },
      { to: "/history", label: 'nav.history', icon: MdHistory },
    ]
  },
  {
    title: 'nav.analysis',
    items: [
      { to: "/reports", label: 'nav.reports', icon: MdBarChart },
      { to: "/insights", label: 'nav.insights', icon: MdInsights },
      { to: "/challenges", label: 'nav.challenges', icon: MdEmojiEvents },
      { to: "/forecasts", label: 'nav.forecasts', icon: MdTrendingUp },
      { to: "/importexport", label: 'nav.importexport', icon: MdFolder },
    ]
  },
  {
    title: 'nav.documents',
    items: [
      { to: "/documents", label: 'nav.myDocuments', icon: MdFolderOpen },
    ]
  },
  {
    title: 'nav.settingsGroup',
    items: [
      { to: "/notifications", label: 'nav.notifications', icon: MdNotifications },
      { to: "/profile", label: 'nav.profile', icon: MdPerson },
      { to: "/settings", label: 'nav.settings', icon: MdSettings },
    ]
  }
];

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');
const avatarUrl = (pic) => (!pic ? null : pic.startsWith('http') ? pic : `${API_BASE}${pic}`);

// Carte « connecté en tant que » : photo + nom, menu de déconnexion au clic
function UserCard({ onNavigate }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [demoActive, setDemoActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const canInstall = useCanInstall();
  const isInstalled = useIsInstalled();
  const ref = useRef(null);

  const refreshDemo = useCallback(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { setDemoActive(false); return; }
    getDemoStatus().then((d) => setDemoActive(d.active)).catch(() => {});
  }, []);
  useEffect(() => {
    refreshDemo();
    window.addEventListener('demo-changed', refreshDemo);
    return () => window.removeEventListener('demo-changed', refreshDemo);
  }, [refreshDemo]);

  const exitDemo = async () => {
    try {
      await removeDemoData();
      window.dispatchEvent(new CustomEvent('transactions-changed'));
      window.dispatchEvent(new CustomEvent('demo-changed'));
      setOpen(false);
      onNavigate?.();
    } catch { /* le menu reste ouvert, nouvelle tentative possible */ }
  };

  const install = async () => {
    if (canInstall) { await promptInstall(); setOpen(false); onNavigate?.(); }
    else setShowHint((v) => !v);
  };

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;
      getCurrentUser().then((u) => { if (!cancelled) { setUser(u); setImgFailed(false); } }).catch(() => {});
    };
    load();
    // Photo ou nom modifiés depuis Mon profil / Paramètres
    window.addEventListener('avatar-updated', load);
    return () => { cancelled = true; window.removeEventListener('avatar-updated', load); };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    onNavigate?.();
    navigate('/login');
  };

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const photo = !imgFailed ? avatarUrl(user?.profilePicture) : null;

  return (
    <div ref={ref} className="relative px-4 py-3 border-t border-gray-200 dark:border-[#334155] bg-white dark:bg-[#1E293B] flex-shrink-0">
      {open && (
        <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155] shadow-xl overflow-hidden" role="menu">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-[#334155]"><ThemeSwitch compact /></div>
          <Link to="/profile" onClick={() => { setOpen(false); onNavigate?.(); }} role="menuitem" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#334155]/50">
            <MdPerson size={18} /> {t('user.myProfile')}
          </Link>
          <button onClick={() => { setOpen(false); onNavigate?.(); window.dispatchEvent(new CustomEvent('start-tour')); }} role="menuitem" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#334155]/50">
            <MdHelpOutline size={18} /> {t('user.tutorial')}
          </button>
          {demoActive && (
            <button onClick={exitDemo} role="menuitem" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 dark:text-[#FCD34D] hover:bg-amber-50 dark:hover:bg-[#78350F]/30">
              <MdScience size={18} /> {t('demo.exit')}
            </button>
          )}
          {!isInstalled && (
            <>
              <button onClick={install} role="menuitem" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-50 dark:hover:bg-[#334155]/50">
                <MdInstallDesktop size={18} /> {t('install.menu')}
              </button>
              {showHint && !canInstall && <p className="px-4 pb-2 text-xs text-gray-600 dark:text-[#CBD5E1]">{t(`install.hint.${manualInstallHint() || 'generic'}`)}</p>}
            </>
          )}
          <button onClick={logout} role="menuitem" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30 border-t border-gray-100 dark:border-[#334155]">
            <MdLogout size={18} /> {t('user.logout')}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors text-left"
      >
        <span className="relative shrink-0">
          {photo ? (
            <img src={photo} alt="" onError={() => setImgFailed(true)} className="w-10 h-10 rounded-full object-cover border-2 border-[#2563EB]" />
          ) : (
            <span className="w-10 h-10 rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white flex items-center justify-center font-bold text-sm">{initials}</span>
          )}
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#334155]" title="Connecté" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">{user?.name || t('user.myAccount')}</span>
          {demoActive
            ? <span className="block text-xs font-semibold text-amber-600 dark:text-[#FCD34D]">{t('demo.badge')}</span>
            : <span className="block text-xs text-green-600 dark:text-[#22C55E]">{t('user.connected')}</span>}
        </span>
        <MdUnfoldMore className="text-gray-400 shrink-0" size={20} />
      </button>
    </div>
  );
}

export default function DashboardSidebar() {
  const { t } = useI18n();
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
      {/* Barre supérieure mobile : menu + marque (le contenu des pages démarre en dessous) */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-50 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-[#334155] shadow-sm flex items-center gap-3 px-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={mobileMenuOpen}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#334155] active:bg-gray-200 dark:active:bg-[#475569]"
        >
          {mobileMenuOpen ? <MdClose size={24} className="text-gray-800 dark:text-[#F8FAFC]" /> : <MdMenu size={24} className="text-gray-800 dark:text-[#F8FAFC]" />}
        </button>
        <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center"><MdDashboard className="text-white" /></span>
          <span className="font-bold text-[#1E3A8A] dark:text-[#60A5FA]">MyBudget+</span>
        </Link>
      </div>

      {/* Overlay pour mobile */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        app-sidebar
        fixed md:static top-14 md:top-0 left-0
        w-72 max-w-[85vw] md:max-w-none
        bg-gradient-to-b from-white dark:from-[#1E293B] to-gray-50 dark:to-[#0F172A]
        border-r border-gray-200 dark:border-[#334155]
        h-[calc(100dvh-3.5rem)] md:h-screen
        transition-all duration-300 ease-in-out
        z-40
        shadow-lg md:shadow-none
        flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Conteneur flex pour organiser logo, nav et bouton */}
        <div className="flex flex-col h-full">
          {/* Logo/Brand - Fixe en haut */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[#334155] flex-shrink-0 flex items-center justify-between gap-2">
            <Link to="/dashboard" className="flex items-center gap-3 group min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                <MdDashboard className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1E3A8A] dark:text-[#60A5FA]">
                  MyBudget+
                </h2>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{t('nav.tagline')}</p>
              </div>
            </Link>
            <PrivacyToggle className="hidden md:flex shrink-0" />
          </div>

          {/* Navigation - Scrollable si nécessaire, occupe l'espace disponible entre logo et bouton */}
          <nav className="flex-1 px-4 py-3 overflow-y-auto min-h-0">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className={sectionIndex > 0 ? "mt-4" : ""}>
              {/* Titre de section */}
              <div className="text-xs font-semibold text-[#1E293B] dark:text-[#E2E8F0] uppercase tracking-wider mb-1.5 px-3">
                {t(section.title)}
              </div>
              
              {/* Items de la section */}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          group relative flex items-center gap-2.5 px-3 py-2 rounded-xl
                          transition-all duration-200 ease-in-out
                          ${
                            active
                              ? "bg-[#1E3A8A] text-white shadow-md"
                              : "text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155] hover:text-[#1E3A8A] dark:hover:text-[#60A5FA]"
                          }
                        `}
                      >
                        {/* Indicateur actif */}
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white dark:bg-[#1E293B] rounded-r-full"></div>
                        )}
                        
                        {/* Icône */}
                        <Icon 
                          size={18} 
                          className={`
                            transition-transform duration-200 flex-shrink-0
                            ${active ? "text-white" : "text-gray-500 dark:text-[#94A3B8] group-hover:text-[#1E3A8A] dark:group-hover:text-[#60A5FA]"}
                            ${active ? "" : "group-hover:scale-110"}
                          `}
                        />
                        
                        {/* Label */}
                        <span className={`
                          font-medium text-sm flex-1
                          ${active ? "text-white font-semibold" : "text-gray-700 dark:text-[#E2E8F0]"}
                        `}>
                          {t(item.label)}
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

          <UserCard onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      </aside>
    </>
  );
}
