import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationAsRead } from '../api.js';

import { formatDate } from '../lib/format.js';
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Charger les notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await getNotifications();
        
        // Le backend retourne { notifications: [...], unreadCount: X }
        const notificationsList = response?.notifications || [];
        const unread = response?.unreadCount || 0;
        
        setNotifications(notificationsList);
        setUnreadCount(unread);
        
        console.log(`🔔 ${notificationsList.length} notifications chargées, ${unread} non lues`);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des notifications:', error);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Actualiser toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Notification ${notificationId} marquée comme lue`);
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'budget_alert':
        return '⚠️';
      case 'budget_exceeded':
        return '🚨';
      case 'transaction_reminder':
        return '💳';
      case 'goal_achieved':
        return '🎯';
      case 'system':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(notifDate);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#334155] transition-colors"
        aria-label="Notifications"
      >
        {/* Icône cloche */}
        <svg 
          className="w-6 h-6 text-[#0F172A] dark:text-[#F8FAFC]" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {/* Badge de compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#2563EB] dark:bg-[#3B82F6] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-[#1E293B] rounded-lg shadow-xl border border-[#E2E8F0] dark:border-[#334155] z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
            <h3 className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs bg-[#DBEAFE] dark:bg-[#1E40AF] text-[#2563EB] dark:text-[#BFDBFE] px-2 py-1 rounded-full">
                  {unreadCount} nouvelles
                </span>
              )}
            </h3>
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline"
            >
              Tout voir
            </Link>
          </div>

          {/* Liste des notifications */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-[#64748B] dark:text-[#94A3B8]">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-[#64748B] dark:text-[#94A3B8]">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F8FAFC] dark:divide-[#334155]">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-[#334155]/50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-[#1E40AF]/25' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icône */}
                      <div className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !notification.isRead 
                            ? 'font-semibold text-[#0F172A] dark:text-[#F8FAFC]' 
                            : 'text-[#64748B] dark:text-[#94A3B8]'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Indicateur non lu */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-gray-50 dark:bg-[#334155]/50">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-[#2563EB] dark:text-[#60A5FA] hover:underline font-medium"
              >
                Voir toutes les notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

