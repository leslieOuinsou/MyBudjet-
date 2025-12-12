import { useState, useEffect, createContext, useContext } from 'react';
import { getCurrentUser } from '../api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = await getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur vérification auth:', err);
        setUser(null);
        setError(err.message);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setError(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isAuthenticated
  };
}
