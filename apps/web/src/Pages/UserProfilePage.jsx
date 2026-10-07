import React, { useState, useEffect } from "react";
import { MdPerson, MdPhotoCamera, MdDelete, MdEmail, MdPhone, MdBadge, MdTune, MdNotifications, MdSecurity, MdLock, MdCheckCircle, MdErrorOutline } from "react-icons/md";
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import { 
  getCurrentUser,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  uploadProfilePicture,
  deleteAvatar
} from '../api.js';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitch from '../components/ThemeSwitch.jsx';

import { setDisplayPrefs } from '../lib/format.js';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

const getAvatarUrl = (profilePicture) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `${API_BASE}${profilePicture}`;
};

const UserProfilePage = () => {
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState("profile");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // États pour les formulaires
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [userData, settingsData] = await Promise.all([
          getCurrentUser(),
          getUserSettings()
        ]);
        
        setUser(userData);
        setSettings(settingsData);
        
        // Initialiser le formulaire de profil
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || ''
        });
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const updated = await updateUserProfile(profileForm);
      setUser((prev) => ({ ...prev, ...updated }));
      window.dispatchEvent(new CustomEvent('avatar-updated'));
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG, GIF, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      const result = await uploadProfilePicture(file);
      const profilePicture = result.profilePicture || result.user?.profilePicture;
      setUser((prev) => ({ ...prev, profilePicture }));
      window.dispatchEvent(new CustomEvent('avatar-updated', {
        detail: { profilePicture },
      }));
      setSuccess('Photo de profil mise à jour');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || "Erreur lors de l'upload de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!user?.profilePicture) return;
    if (!window.confirm('Supprimer votre photo de profil ?')) return;

    try {
      setUploadingPhoto(true);
      setError('');
      await deleteAvatar();
      setUser((prev) => ({ ...prev, profilePicture: null }));
      window.dispatchEvent(new CustomEvent('avatar-updated', {
        detail: { profilePicture: null },
      }));
      setSuccess('Photo de profil supprimée');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Fonction pour mettre à jour les paramètres et recharger
  const handleSettingsUpdate = async (updates) => {
    try {
      console.log('🔄 Mise à jour des paramètres:', updates);
      setError('');
      setSuccess('');
      
      await updateUserSettings(updates);
      console.log('✅ Paramètres envoyés au backend');
      
      // Recharger les paramètres pour afficher la nouvelle valeur
      const updatedSettings = await getUserSettings();
      console.log('📥 Paramètres rechargés:', updatedSettings);
      
      setSettings(updatedSettings);
      setDisplayPrefs({ ...updatedSettings?.appearance, autoSync: Boolean(updatedSettings?.data?.autoBackup) });
      console.log('🔄 State settings mis à jour');
      
      setSuccess('Paramètres mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour des paramètres:', err);
      setError(err.message || 'Erreur lors de la mise à jour des paramètres');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-100 dark:bg-[#0F172A]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-[#CBD5E1]'}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const t = isDarkMode
    ? { page: 'bg-[#0F172A]', card: 'bg-[#1E293B] border-[#334155]', title: 'text-white', muted: 'text-gray-400', input: 'bg-[#334155] border-[#334155] text-white placeholder-gray-500', tabOff: 'bg-[#334155] text-gray-300 hover:bg-[#475569]', soft: 'bg-[#334155]' }
    : { page: 'bg-[#F8FAFC] dark:bg-[#334155]/50', card: 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-[#334155]', title: 'text-[#0F172A] dark:text-[#F8FAFC]', muted: 'text-gray-500 dark:text-[#94A3B8]', input: 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]', tabOff: 'bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-[#CBD5E1] hover:bg-gray-200 dark:hover:bg-[#475569]', soft: 'bg-[#F8FAFC] dark:bg-[#334155]/50' };
  const CARD = `rounded-2xl border shadow-sm p-5 md:p-6 ${t.card}`;
  const INPUT = `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 ${t.input}`;
  const LABEL = `block text-sm font-medium mb-1 ${t.title}`;
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const avatar = getAvatarUrl(user?.profilePicture);

  const TABS = [
    { id: 'profile', label: 'Affichage', icon: MdTune },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'securite', label: 'Sécurité', icon: MdSecurity },
    { id: 'confidentialite', label: 'Confidentialité', icon: MdLock },
  ];

  const NOTIF_ROWS = [
    { key: 'email', label: 'Notifications par e-mail', description: 'Recevez des mises à jour importantes et des résumés par e-mail.' },
    { key: 'sms', label: 'Notifications par SMS', description: 'Recevez des alertes rapides sur vos dépenses importantes.' },
    { key: 'push', label: 'Notifications push', description: 'Recevez des alertes directement sur votre appareil mobile ou votre navigateur.' },
  ];

  const selectOptions = (list) => list.map(([value, label]) => (
    <option key={value} value={value} style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>{label}</option>
  ));

  return (
    <div className={`min-h-screen flex flex-col ${t.page}`}>
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-10 pt-16 md:pt-10 space-y-6 max-w-5xl">
          {/* Bandeau profil */}
          <header className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white p-6 md:p-8 shadow-sm flex items-center gap-5 flex-wrap">
            {avatar ? (
              <img src={avatar} alt={user?.name || 'Avatar'} className="w-20 h-20 rounded-full object-cover border-4 border-white/40" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-2xl font-extrabold">{initials}</div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold truncate">{user?.name || 'Mon profil'}</h1>
              <p className="text-white/85 text-sm mt-0.5 truncate">{user?.email}</p>
              <p className="text-white/75 text-xs mt-1">Gérez vos informations personnelles, votre photo de profil et vos préférences.</p>
            </div>
          </header>

          {error && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 dark:bg-[#7F1D1D]/30 border-red-200 dark:border-[#7F1D1D] text-red-700 dark:text-[#FCA5A5]'}`}>
              <MdErrorOutline className="text-xl shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 dark:bg-[#14532D]/30 border-green-200 dark:border-[#166534] text-green-700 dark:text-[#4ADE80]'}`}>
              <MdCheckCircle className="text-xl shrink-0" /> {success}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Infos personnelles */}
            <section className={`${CARD} lg:col-span-2`}>
              <h2 className={`flex items-center gap-2 font-bold text-lg mb-4 ${t.title}`}><MdPerson className="text-[#2563EB] dark:text-[#60A5FA] text-2xl" /> Informations personnelles</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className={LABEL}><MdBadge className="inline mr-1 text-gray-400" />Nom complet</label>
                  <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className={INPUT} placeholder="Votre nom complet" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL}><MdEmail className="inline mr-1 text-gray-400" />Email</label>
                    <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className={INPUT} placeholder="votre@email.com" />
                  </div>
                  <div>
                    <label className={LABEL}><MdPhone className="inline mr-1 text-gray-400" />Téléphone</label>
                    <input type="tel" value={profileForm.phoneNumber} onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} className={INPUT} placeholder="+33 6 12 34 56 78" />
                  </div>
                </div>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#2563EB] dark:bg-[#3B82F6] text-white font-semibold text-sm hover:bg-[#1D4ED8] dark:hover:bg-[#2563EB]">
                  Mettre à jour le profil
                </button>
              </form>
            </section>

            {/* Photo de profil */}
            <section className={`${CARD} flex flex-col items-center text-center`}>
              <h2 className={`flex items-center gap-2 font-bold text-lg mb-4 ${t.title}`}><MdPhotoCamera className="text-[#2563EB] dark:text-[#60A5FA] text-2xl" /> Photo de profil</h2>
              {avatar ? (
                <img src={avatar} alt={user?.name || 'Avatar'} className="w-28 h-28 rounded-full object-cover border-4 border-[#DBEAFE] dark:border-[#1E40AF] shadow" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] dark:to-[#3B82F6] text-white flex items-center justify-center font-extrabold text-3xl shadow">{initials}</div>
              )}
              <input id="profile-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
              <label
                htmlFor="profile-photo-upload"
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${uploadingPhoto ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${t.tabOff}`}
              >
                <MdPhotoCamera /> {uploadingPhoto ? 'Envoi en cours…' : 'Changer la photo'}
              </label>
              {user?.profilePicture && (
                <button type="button" onClick={handlePhotoDelete} disabled={uploadingPhoto} className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 dark:text-[#F87171] hover:text-red-700 dark:hover:text-[#FCA5A5]">
                  <MdDelete /> Supprimer
                </button>
              )}
              <p className={`text-xs mt-3 ${t.muted}`}>JPG, PNG, GIF • max 5 Mo</p>
            </section>
          </div>

          {/* Préférences */}
          <section className={CARD}>
            <h2 className={`font-bold text-lg mb-1 ${t.title}`}>Préférences</h2>
            <p className={`mb-4 text-sm ${t.muted}`}>Gérez vos paramètres d’affichage, de notification, de sécurité et de confidentialité.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${tab === id ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white' : t.tabOff}`}
                >
                  <Icon /> {label}
                </button>
              ))}
            </div>

            {tab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Devise par défaut</label>
                    <select
                      value={settings?.appearance?.currency || 'EUR'}
                      onChange={(e) => handleSettingsUpdate({ appearance: { currency: e.target.value } })}
                      className={INPUT}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      {selectOptions([['EUR', 'Euro (€)'], ['USD', 'Dollar ($)'], ['GBP', 'Livre Sterling (£)']])}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Format de date</label>
                    <select
                      value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => handleSettingsUpdate({ appearance: { dateFormat: e.target.value } })}
                      className={INPUT}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      {selectOptions([['DD/MM/YYYY', 'DD/MM/YYYY (26/07/2024)'], ['MM/DD/YYYY', 'MM/DD/YYYY (07/26/2024)'], ['YYYY-MM-DD', 'YYYY-MM-DD (2024-07-26)']])}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Thème</label>
                  <div className={`rounded-xl border px-4 py-1 ${t.card}`}><ThemeSwitch /></div>
                  <p className={`text-xs mt-1 ${t.muted}`}>Le choix est mémorisé sur votre compte et retrouvé sur vos autres appareils.</p>
                </div>
                <div className="md:max-w-sm">
                  <label className={LABEL}>Langue</label>
                  <select
                    value={settings?.appearance?.language || 'fr'}
                    onChange={(e) => handleSettingsUpdate({ appearance: { language: e.target.value } })}
                    className={INPUT}
                    style={isDarkMode ? { colorScheme: 'dark' } : {}}
                  >
                    {selectOptions([['fr', 'Français'], ['en', 'English'], ['es', 'Español']])}
                  </select>
                </div>
              </div>
            )}

            {tab === 'notifications' && (
              <div className={`divide-y ${isDarkMode ? 'divide-[#334155]' : 'divide-gray-100 dark:divide-[#334155]'}`}>
                {NOTIF_ROWS.map(({ key, label, description }) => {
                  const on = Boolean(settings?.notifications?.[key]);
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div>
                        <div className={`font-semibold ${t.title}`}>{label}</div>
                        <div className={`text-sm mt-0.5 ${t.muted}`}>{description}</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer shrink-0">
                        <input type="checkbox" checked={on} onChange={() => handleSettingsUpdate({ notifications: { [key]: !on } })} className="sr-only" aria-label={label} />
                        <span className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 ${on ? 'bg-green-500' : 'bg-gray-300 dark:bg-[#475569]'}`}>
                          <span className={`bg-white dark:bg-[#1E293B] w-5 h-5 rounded-full shadow transform duration-300 ${on ? 'translate-x-5' : ''}`}></span>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'securite' && (
              <div className={`rounded-xl p-5 text-sm ${t.soft} ${t.muted}`}>Paramètres de sécurité à venir...</div>
            )}
            {tab === 'confidentialite' && (
              <div className={`rounded-xl p-5 text-sm ${t.soft} ${t.muted}`}>Paramètres de confidentialité à venir...</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage;
