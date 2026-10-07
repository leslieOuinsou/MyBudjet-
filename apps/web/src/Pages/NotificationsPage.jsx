import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getCurrentUser
} from '../api.js';

import { formatDate } from '../lib/format.js';
const initialSettings = {
  budget: true,
  bill: true,
  security: true,
  update: true,
  marketing: false,
  weekly: true,
};

const typeColors = {
  budget: "bg-[#1E73BE] text-white",
  budget_alert: "bg-[#1E73BE] text-white",
  budget_exceeded: "bg-red-600 text-white",
  bill: "bg-green-500 text-white",
  security: "bg-yellow-500 text-white",
  update: "bg-gray-400 text-white",
  transaction: "bg-red-500 text-white",
  transaction_reminder: "bg-orange-500 text-white",
  marketing: "bg-purple-500 text-white",
  weekly: "bg-blue-500 text-white",
  goal_achieved: "bg-emerald-500 text-white",
  system: "bg-gray-600 text-white",
};

const typeLabels = {
  budget: "Budget",
  budget_alert: "Alerte budget",
  budget_exceeded: "Budget dépassé",
  bill: "Facture",
  security: "Sécurité",
  update: "Application",
  transaction: "Transaction",
  transaction_reminder: "Rappel transaction",
  marketing: "Marketing",
  weekly: "Hebdomadaire",
  goal_achieved: "Objectif atteint",
  system: "Système",
};

// Interrupteur de préférence avec état de sauvegarde
const SettingSwitch = ({ label, description, settingKey, value, saving, onToggle }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="font-medium flex items-center gap-2">
        {label}
        {saving && (
          <span className="inline-block h-3 w-3 rounded-full border-2 border-[#1E73BE] border-t-transparent animate-spin" title="Enregistrement…" />
        )}
      </div>
      <div className="text-gray-500 text-sm">{description}</div>
    </div>
    <label className={`inline-flex items-center ${saving ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={value}
        onChange={() => onToggle(settingKey)}
        disabled={saving}
        className="sr-only"
      />
      <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${value ? 'bg-[#1E73BE]' : ''}`}>
        <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${value ? 'translate-x-5' : ''}`}></span>
      </span>
    </label>
  </div>
);

const NotificationsPage = () => {
  const [settings, setSettings] = useState(initialSettings);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [user, setUser] = useState(null);

  // Afficher un message de confirmation temporaire
  const showSavedMessage = (text = 'Préférences enregistrées ✓') => {
    setSavedMessage(text);
    setActionError('');
    setTimeout(() => setSavedMessage(''), 2500);
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [notificationsData, preferencesData, userData] = await Promise.all([
          getNotifications({ limit: 50 }),
          getNotificationPreferences(),
          getCurrentUser()
        ]);

        setNotifications(notificationsData.notifications || []);
        if (preferencesData.preferences) {
          setSettings(preferencesData.preferences);
        }
        setUser(userData);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSwitch = async (key) => {
    if (savingKey) return; // éviter les clics simultanés
    const previousSettings = settings;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSavingKey(key);
    setActionError('');

    try {
      // Mettre à jour les préférences sur le serveur
      await updateNotificationPreferences({
        preferences: newSettings
      });
      showSavedMessage();
    } catch (err) {
      // Revenir à l'état précédent en cas d'erreur
      setSettings(previousSettings);
      setActionError(err.message || 'Erreur lors de la mise à jour des préférences');
      setSavedMessage('');
    } finally {
      setSavingKey(null);
    }
  };

  // Enregistrer explicitement toutes les préférences (bouton)
  const handleSaveAll = async () => {
    setSavingAll(true);
    setActionError('');
    try {
      await updateNotificationPreferences({
        preferences: settings
      });
      showSavedMessage();
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la mise à jour des préférences');
      setSavedMessage('');
    } finally {
      setSavingAll(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      setActionError(err.message || 'Erreur lors du marquage de la notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      showSavedMessage('Toutes les notifications sont lues ✓');
    } catch (err) {
      setActionError(err.message || 'Erreur lors du marquage des notifications');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la suppression de la notification');
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'il y a quelques secondes';
    if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} minutes`;
    if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)} heures`;
    if (diffInSeconds < 2592000) return `il y a ${Math.floor(diffInSeconds / 86400)} jours`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#1E73BE] text-white px-4 py-2 rounded hover:bg-[#155a8a]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 p-10">
          <h1 className="text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-gray-500 mb-4">
            Gérez vos notifications et restez informé sur MyBudget+.
            {user && ` Bonjour ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
          </p>
          {/* Messages de confirmation / d'erreur des actions */}
          {savedMessage && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
              {savedMessage}
            </div>
          )}
          {actionError && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
              {actionError}
            </div>
          )}
          <div className="flex flex-wrap gap-8">
            {/* Notifications récentes */}
            <section className="bg-white rounded-xl shadow p-6 flex-1 min-w-[320px] max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Notifications Récentes</h2>
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[#1E73BE] text-sm font-medium hover:underline"
                >
                  Marquer tout comme lu
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs">
                    <th className="text-left font-normal pb-2">TYPE</th>
                    <th className="text-left font-normal pb-2">MESSAGE</th>
                    <th className="text-left font-normal pb-2">HEURE</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-500">
                        Aucune notification pour le moment
                      </td>
                    </tr>
                  ) : (
                    notifications.map((n) => (
                      <tr key={n._id} className={`align-top border-t last:border-b-0 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                        <td className="py-2 pr-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${typeColors[n.type] || 'bg-gray-400 text-white'}`}>
                            {typeLabels[n.type] || n.type}
                          </span>
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex items-center justify-between">
                            <span className={!n.isRead ? 'font-medium' : ''}>{n.message}</span>
                            <div className="flex gap-2 ml-2">
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n._id)}
                                  className="text-[#1E73BE] text-xs hover:underline"
                                  title="Marquer comme lu"
                                >
                                  ✓
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotification(n._id)}
                                className="text-red-500 text-xs hover:underline"
                                title="Supprimer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(n.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
            {/* Paramètres de notification */}
            <section className="bg-white rounded-xl shadow p-6 flex-1 min-w-[320px] max-w-md">
              <h2 className="font-semibold text-lg mb-4">Paramètres de Notification</h2>
              <div className="space-y-5">
                {[
                  { key: 'budget', label: 'Alertes Budgétaires', description: 'Recevez des notifications lorsque vous dépassez un budget défini ou que vous êtes proche de la limite.' },
                  { key: 'bill', label: 'Rappels de Factures', description: 'Soyez alerté avant la date d\'échéance de vos factures récurrentes.' },
                  { key: 'security', label: 'Alertes de Sécurité', description: 'Notifications importantes concernant la sécurité de votre compte et les activités suspectes.' },
                  { key: 'update', label: 'Mises à Jour de l\'Application', description: 'Recevez des nouvelles sur les améliorations de l\'application, les nouvelles fonctionnalités et les correctifs.' },
                  { key: 'marketing', label: 'E-mails Marketing', description: 'Recevez des offres spéciales, des promotions et du contenu exclusif.' },
                  { key: 'weekly', label: 'Rapports Hebdomadaires', description: 'Recevez un résumé de vos dépenses et de vos économies de la semaine par e-mail.' },
                ].map(({ key, label, description }) => (
                  <SettingSwitch
                    key={key}
                    settingKey={key}
                    label={label}
                    description={description}
                    value={!!settings[key]}
                    saving={savingKey === key}
                    onToggle={handleSwitch}
                  />
                ))}
              </div>
              <button
                onClick={handleSaveAll}
                disabled={savingAll}
                className={`mt-8 w-full py-2 rounded-lg font-semibold text-white transition-colors ${savingAll ? 'bg-[#155a8a] opacity-70 cursor-not-allowed' : 'bg-[#1E73BE] hover:bg-[#155a8a]'}`}
              >
                {savingAll ? 'Enregistrement…' : 'Enregistrer les préférences'}
              </button>
              <p className="mt-2 text-center text-gray-400 text-xs">
                Vos changements sont aussi enregistrés automatiquement à chaque clic sur un réglage.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
