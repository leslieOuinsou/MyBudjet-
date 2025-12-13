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
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('🔄 Rechargement des données utilisateur dans DashboardHeader...');
      const userData = await getCurrentUser();
      console.log('👤 Données utilisateur mises à jour:', userData?.profilePicture ? 'Avatar présent' : 'Pas d\'avatar');
      setUser(userData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    } finally {
      setLoading(false);
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
    if (loading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          <div className="hidden md:block">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const avatarUrl = user?.profilePicture 
      ? `${API_URL.replace('/api', '')}${user.profilePicture}`
      : null;
    
    const initials = getInitials(user?.name);
    const firstName = user?.name ? user.name.split(' ')[0] : 'Utilisateur';

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
              className="w-10 h-10 rounded-full border-2 border-[#1E73BE] object-cover shadow-md group-hover:shadow-lg transition-shadow"
              onError={(e) => {
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
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#1E73BE] to-[#155a8a] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:shadow-lg transition-all group-hover:scale-105 ${
              avatarUrl ? 'hidden' : 'flex'
            }`}
          >
            {initials}
          </div>
        </div>
        
        {/* Nom de l'utilisateur (visible sur desktop) */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-[#343A40] group-hover:text-[#1E73BE] transition-colors">
            {firstName}
          </div>
          <div className="text-xs text-[#6C757D]">
            Connecté
          </div>
        </div>
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-4 md:px-6">
        <span className="text-[#1E73BE] font-bold text-lg md:text-xl">MyBudget+</span>
        <nav className="hidden lg:flex gap-4 xl:gap-8 text-[#343A40] font-medium text-sm">
          <Link to="/dashboard" className="text-[#1E73BE] font-bold">Tableau de bord</Link>
          <Link to="/budgets" className="hover:text-[#1E73BE]">Budgets</Link>
          <Link to="/importexport" className="hover:text-[#1E73BE]">Données</Link>
          <Link to="/forecasts" className="hover:text-[#1E73BE]">Prévisions</Link>
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="ml-2 xl:ml-4 px-2 xl:px-3 py-1 rounded border border-[#F5F7FA] bg-[#F5F7FA] text-[#343A40] text-sm w-32 xl:w-auto" 
          />
        </nav>
        <div className="flex gap-2 items-center">
          <NotificationBell />
          <Link to="/importexport" className="hidden md:block bg-[#1E73BE] text-white px-3 md:px-4 py-2 rounded hover:bg-[#155a8a] text-sm">Importer/Exporter</Link>
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
