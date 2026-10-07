import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../api';
import { loadDisplayPrefs } from '../lib/format.js';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier d'abord localStorage, puis sessionStorage (comme getAuthHeaders)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        console.log('🔍 ProtectedRoute - Vérification auth');
        console.log('   Token localStorage:', localStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
        console.log('   Token sessionStorage:', sessionStorage.getItem('token') ? '✅ Présent' : '❌ Absent');
        console.log('   Token trouvé:', token ? '✅ Oui' : '❌ Non');
        
        if (!token) {
          console.log('❌ Aucun token trouvé, redirection vers /login');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Vérifier si l'utilisateur est authentifié
        console.log('📡 Vérification de l\'utilisateur avec le backend...');
        const user = await getCurrentUser();
        console.log('✅ Utilisateur authentifié:', user.email, 'Rôle:', user.role);
        // Devise / format de date / langue du compte, appliqués avant l'affichage des pages
        await loadDisplayPrefs().catch(() => {});
        setIsAuthenticated(true);
        setUserRole(user.role);
        
      } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        // Token invalide ou expiré - nettoyer les deux storages
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Affichage de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Redirection si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification du rôle admin si requis
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
