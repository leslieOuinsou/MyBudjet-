import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell.jsx";
import { getCurrentUser } from "../api.js";

export default function DashboardHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger les données utilisateur
  const loadUser = async () => {
    try {
      // Vérifier le token dans localStorage ET sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      console.log('🔄 DashboardHeader - Chargement utilisateur...');
      console.log('   Token localStorage:', localStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
      console.log('   Token sessionStorage:', sessionStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
      console.log('   Token trouvé:', token ? '✅ Oui' : '❌ Non');
      
      if (!token) {
        console.log('⚠️ Aucun token trouvé, pas de chargement utilisateur');
        setLoading(false);
        setUser(null);
        return;
      }

      console.log('📡 Appel API getCurrentUser...');
      const userData = await getCurrentUser();
      console.log('✅ Données utilisateur reçues:', userData);
      console.log('   Nom:', userData?.name);
      console.log('   Email:', userData?.email);
      console.log('   Avatar:', userData?.profilePicture ? '✅ Présent' : '❌ Absent');
      
      setUser(userData);
      console.log('✅ Utilisateur défini dans le state');
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('✅ Loading terminé');
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Écouter les changements d'avatar
  useEffect(() => {
    const handleAvatarUpdate = () => {
      console.log('🔔 Événement avatar-updated reçu, rechargement...');
      loadUser();
    };

    // Écouter l'événement personnalisé
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    
    // Écouter aussi les changements de focus pour recharger
    const handleFocus = () => {
      loadUser();
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Fonction pour extraire les initiales
  const getInitials = (name) => {
    if (!name) return 'U';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  // Composant Avatar avec initiales
  const UserAvatar = () => {
    console.log('🎨 UserAvatar render - loading:', loading, 'user:', user);
    
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#475569] animate-pulse"></div>
          <div className="hidden md:block">
            <div className="h-4 w-24 bg-gray-200 dark:bg-[#475569] rounded animate-pulse"></div>
          </div>
        </div>
      );
    }

    // Si pas d'utilisateur mais qu'on a un token, afficher quand même quelque chose
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!user && !token) {
      console.log('⚠️ Pas d\'utilisateur et pas de token, pas d\'affichage');
      return null;
    }

    // Si pas d'utilisateur mais qu'on a un token, afficher un placeholder
    if (!user) {
      console.log('⚠️ Pas d\'utilisateur mais token présent, affichage placeholder');
      return (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] dark:from-[#3B82F6] to-[#1D4ED8] dark:to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-md">
            U
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Utilisateur
            </div>
            <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Chargement...
            </div>
          </div>
        </div>
      );
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const avatarUrl = user?.profilePicture
      ? user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `${API_URL.replace('/api', '')}${user.profilePicture}`
      : null;
    
    const initials = getInitials(user?.name);
    const firstName = user?.name ? user.name.split(' ')[0] : 'Utilisateur';
    
    console.log('👤 Affichage avatar - Initiales:', initials, 'Prénom:', firstName);

    return (
      <Link 
        to="/profile" 
        className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity group"
      >
        {/* Avatar ou Initiales */}
        <div className="relative">
          {avatarUrl ? (
            // Afficher l'avatar si disponible
            <img 
              src={avatarUrl} 
              alt={user?.name || 'Avatar'} 
              className="w-10 h-10 rounded-full border-2 border-[#2563EB] object-cover shadow-md group-hover:shadow-lg transition-shadow"
              onError={(e) => {
                console.log('❌ Erreur chargement avatar, affichage initiales');
                // Si l'image ne charge pas, masquer l'image et afficher les initiales
                e.target.style.display = 'none';
                const initialsDiv = e.target.nextElementSibling;
                if (initialsDiv) {
                  initialsDiv.style.display = 'flex';
                }
              }}
            />
          ) : null}
          {/* Initiales (toujours présentes, affichées si pas d'avatar ou si avatar échoue) */}
          <div 
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] dark:from-[#3B82F6] to-[#1D4ED8] dark:to-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 ${
              avatarUrl ? 'hidden' : 'flex'
            }`}
          >
            {initials || 'U'}
          </div>
        </div>
        
        {/* Nom de l'utilisateur (visible sur desktop) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">
            {firstName}
          </div>
          <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Connecté
          </div>
        </div>
      </Link>
    );
  };

  return (
    <header className="bg-white dark:bg-[#1E293B] shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-6">
        <span className="text-[#2563EB] dark:text-[#60A5FA] font-bold text-lg md:text-xl">MyBudget+</span>
        <nav className="hidden lg:flex gap-4 xl:gap-8 text-[#0F172A] dark:text-[#F8FAFC] font-medium text-sm">
          <Link to="/dashboard" className="text-[#2563EB] dark:text-[#60A5FA] font-bold">Tableau de bord</Link>
          <Link to="/budgets" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA]">Budgets</Link>
          <Link to="/importexport" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA]">Données</Link>
          <Link to="/forecasts" className="hover:text-[#2563EB] dark:hover:text-[#60A5FA]">Prévisions</Link>
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="ml-2 xl:ml-4 px-2 xl:px-3 py-1 rounded border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#334155]/50 text-[#0F172A] dark:text-[#F8FAFC] text-sm w-32 xl:w-auto" 
          />
        </nav>
        <div className="flex gap-2 items-center">
          <NotificationBell />
          <Link to="/importexport" className="hidden md:block bg-[#2563EB] dark:bg-[#3B82F6] text-white px-3 md:px-4 py-2 rounded hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB] text-sm">Importer/Exporter</Link>
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
