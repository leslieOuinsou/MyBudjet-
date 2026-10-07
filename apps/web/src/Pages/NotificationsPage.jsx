import React, { useState, useEffect } from "react";
import {
  MdNotifications, MdDoneAll, MdClose, MdCheck, MdAccountBalanceWallet, MdReceiptLong, MdSecurity,
  MdSystemUpdate, MdCampaign, MdSummarize, MdEmojiEvents, MdWarning, MdSwapHoriz, MdInfo, MdNotificationsNone
} from "react-icons/md";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getCurrentUser,
  getUserSettings,
  updateUserSettings
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

const typeVisuals = {
  budget: { icon: MdAccountBalanceWallet, tone: 'bg-blue-100 dark:bg-[#1E40AF]/50 text-blue-600 dark:text-[#BFDBFE]' },
  budget_alert: { icon: MdWarning, tone: 'bg-amber-100 dark:bg-[#78350F/50] text-amber-600' },
  budget_exceeded: { icon: MdWarning, tone: 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-600 dark:text-[#F87171]' },
  bill: { icon: MdReceiptLong, tone: 'bg-green-100 dark:bg-[#14532D]/50 text-green-600 dark:text-[#22C55E]' },
  security: { icon: MdSecurity, tone: 'bg-yellow-100 dark:bg-[#78350F]/50 text-yellow-600 dark:text-[#FBBF24]' },
  update: { icon: MdSystemUpdate, tone: 'bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1]' },
  transaction: { icon: MdSwapHoriz, tone: 'bg-red-100 dark:bg-[#7F1D1D]/50 text-red-500 dark:text-[#F87171]' },
  transaction_reminder: { icon: MdSwapHoriz, tone: 'bg-orange-100 dark:bg-[#78350F]/50 text-orange-600 dark:text-[#FBBF24]' },
  marketing: { icon: MdCampaign, tone: 'bg-purple-100 dark:bg-[#4C1D95]/40 text-purple-600 dark:text-[#A78BFA]' },
  weekly: { icon: MdSummarize, tone: 'bg-sky-100 text-sky-600' },
  goal_achieved: { icon: MdEmojiEvents, tone: 'bg-emerald-100 text-emerald-600' },
  system: { icon: MdInfo, tone: 'bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1]' },
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
  <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
    <div className="min-w-0">
      <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
        {label}
        {saving && (
          <span className="inline-block h-3 w-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" title="Enregistrement…" />
        )}
      </div>
      <div className="text-gray-500 dark:text-[#94A3B8] text-sm mt-0.5">{description}</div>
    </div>
    <label className={`inline-flex items-center shrink-0 ${saving ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={value}
        onChange={() => onToggle(settingKey)}
        disabled={saving}
        className="sr-only"
        aria-label={label}
      />
      <span className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 ${value ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#475569]'}`}>
        <span className={`bg-white dark:bg-[#1E293B] w-5 h-5 rounded-full shadow transform duration-300 ${value ? 'translate-x-5' : ''}`}></span>
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
  const [emailChannel, setEmailChannel] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);

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
        // Canal e-mail : facultatif, ne bloque pas la page
        getUserSettings().then((st) => setEmailChannel(st?.notifications?.email !== false)).catch(() => {});
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

  // Recevoir aussi chaque notification par e-mail
  const handleEmailChannel = async () => {
    const next = !emailChannel;
    setEmailChannel(next);
    setSavingEmail(true);
    setActionError('');
    try {
      await updateUserSettings({ notifications: { email: next } });
      showSavedMessage(next ? 'Vous recevrez aussi vos notifications par e-mail ✓' : 'Notifications par e-mail désactivées ✓');
    } catch (err) {
      setEmailChannel(!next);
      setActionError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingEmail(false);
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-[#CBD5E1]">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-[#F87171] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#2563EB] dark:bg-[#3B82F6] text-white px-4 py-2 rounded hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col">
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-5 md:p-10 space-y-6 max-w-6xl">
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-6 md:p-8 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="relative w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
                <MdNotifications />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center">{unreadCount}</span>
                )}
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">Notifications</h1>
                <p className="text-white/85 text-sm mt-1">
                  Gérez vos notifications et restez informé sur MyBudget+.
                  {user && ` Bonjour ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
                </p>
              </div>
            </div>
            <div className="text-sm bg-white/15 rounded-xl px-4 py-2">
              <strong>{unreadCount}</strong> non lue{unreadCount > 1 ? 's' : ''} · {notifications.length} au total
            </div>
          </header>

          {savedMessage && (
            <div className="px-4 py-3 rounded-xl bg-green-50 dark:bg-[#14532D]/30 text-green-700 dark:text-[#4ADE80] text-sm border border-green-200 dark:border-[#166534]">{savedMessage}</div>
          )}
          {actionError && (
            <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-[#7F1D1D]/30 text-red-700 dark:text-[#FCA5A5] text-sm border border-red-200 dark:border-[#7F1D1D]">{actionError}</div>
          )}

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Notifications récentes */}
            <section className="lg:col-span-3 min-w-0 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm p-5 md:p-6">
              <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                <h2 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC]">Notifications récentes</h2>
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1.5 text-[#2563EB] dark:text-[#60A5FA] text-sm font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  <MdDoneAll /> Marquer tout comme lu
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-[#94A3B8]">
                  <MdNotificationsNone className="mx-auto text-5xl text-gray-300 mb-2" />
                  Aucune notification pour le moment
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {notifications.map((n) => {
                    const visual = typeVisuals[n.type] || typeVisuals.system;
                    const Icon = visual.icon;
                    return (
                      <li
                        key={n._id}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${!n.isRead ? 'bg-[#EFF6FF] dark:bg-[#1E40AF]/30 border-[#BFDBFE] dark:border-[#1E40AF]' : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-[#334155]'}`}
                      >
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${visual.tone}`}><Icon /></span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#94A3B8]">
                            <span className="font-semibold uppercase tracking-wide">{typeLabels[n.type] || n.type}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(n.createdAt)}</span>
                            {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" title="Non lue" />}
                          </div>
                          <p className={`text-sm mt-0.5 break-words text-[#0F172A] dark:text-[#F8FAFC] ${!n.isRead ? 'font-semibold' : ''}`}>{n.message}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n._id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#2563EB] dark:text-[#BFDBFE] hover:bg-[#DBEAFE] dark:hover:bg-[#1E40AF]"
                              title="Marquer comme lu"
                              aria-label="Marquer comme lu"
                            >
                              <MdCheck />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(n._id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 dark:hover:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#7F1D1D]/30"
                            title="Supprimer"
                            aria-label="Supprimer"
                          >
                            <MdClose />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Paramètres de notification */}
            <section className="lg:col-span-2 min-w-0 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-[#334155] shadow-sm p-5 md:p-6 self-start">
              <h2 className="font-bold text-lg text-[#0F172A] dark:text-[#F8FAFC] mb-5">Paramètres de notification</h2>
              <div className="mb-5 rounded-xl bg-[#EFF6FF] dark:bg-[#1E40AF]/30 border border-[#BFDBFE] dark:border-[#1E40AF] p-4">
                <SettingSwitch
                  settingKey="channelEmail"
                  label="Recevoir aussi par e-mail"
                  description={`Chaque notification activée ci-dessous est aussi envoyée à ${user?.email || 'votre adresse e-mail'}.`}
                  value={emailChannel}
                  saving={savingEmail}
                  onToggle={handleEmailChannel}
                />
              </div>
              <div className="divide-y divide-gray-100 dark:divide-[#334155]">
                {[
                  { key: 'budget', label: 'Alertes budgétaires', description: 'Recevez des notifications lorsque vous dépassez un budget défini ou que vous êtes proche de la limite.' },
                  { key: 'bill', label: 'Rappels de factures', description: 'Soyez alerté avant la date d\'échéance de vos factures récurrentes.' },
                  { key: 'security', label: 'Alertes de sécurité', description: 'Notifications importantes concernant la sécurité de votre compte et les activités suspectes.' },
                  { key: 'update', label: 'Mises à jour de l\'application', description: 'Recevez des nouvelles sur les améliorations de l\'application, les nouvelles fonctionnalités et les correctifs.' },
                  { key: 'marketing', label: 'E-mails marketing', description: 'Recevez des offres spéciales, des promotions et du contenu exclusif.' },
                  { key: 'weekly', label: 'Rapports hebdomadaires', description: 'Recevez un résumé de vos dépenses et de vos économies de la semaine par e-mail.' },
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
                className={`mt-6 w-full py-2.5 rounded-xl font-semibold text-white transition-colors ${savingAll ? 'bg-[#1D4ED8] dark:bg-[#2563EB] opacity-70 cursor-not-allowed' : 'bg-[#2563EB] dark:bg-[#3B82F6] hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]'}`}
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
