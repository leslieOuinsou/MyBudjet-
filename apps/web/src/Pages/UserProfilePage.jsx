import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 xl:p-10 pt-16 md:pt-10">
          <h1 className={`text-xl md:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Mon Profil</h1>
          <p className={`mb-4 md:mb-6 lg:mb-8 text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Gérez vos informations personnelles, votre photo de profil et vos préférences.
            {user && ` Bonjour ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
          </p>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className={`border px-4 py-3 rounded mb-4 ${isDarkMode ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-100 border-red-400 text-red-700'}`}>
              {error}
            </div>
          )}
          {success && (
            <div className={`border px-4 py-3 rounded mb-4 ${isDarkMode ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-100 border-green-400 text-green-700'}`}>
              {success}
            </div>
          )}
          <div className="flex flex-col lg:flex-row flex-wrap gap-4 md:gap-6 lg:gap-8 mb-4 md:mb-6 lg:mb-8">
            {/* Infos personnelles */}
            <section className={`rounded-xl shadow p-4 md:p-6 flex-1 min-w-[280px] lg:min-w-[320px] lg:max-w-md ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h2 className={`font-semibold text-base md:text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Informations Personnelles</h2>
                <button className="text-[#1E73BE] text-xs md:text-sm font-medium">Modifier</button>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-3">
                <div>
                  <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Nom complet</label>
                  <input 
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className={`border rounded px-3 py-2 text-sm md:text-base w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Email</label>
                  <input 
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className={`border rounded px-3 py-2 text-sm md:text-base w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Téléphone</label>
                  <input 
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                    className={`border rounded px-3 py-2 text-sm md:text-base w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <button type="submit" className="w-full bg-[#1E73BE] text-white px-3 md:px-4 py-2 rounded font-semibold text-sm md:text-base hover:bg-[#155a8a]">
                  Mettre à jour le profil
                </button>
              </form>
            </section>
            {/* Photo de profil */}
            <section className={`rounded-xl shadow p-4 md:p-6 flex flex-col items-center min-w-[240px] lg:min-w-[260px] lg:max-w-xs ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
              <h2 className={`font-semibold text-base md:text-lg mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Photo de Profil</h2>
              <div className="relative mb-3 md:mb-4">
                {getAvatarUrl(user?.profilePicture) ? (
                  <img
                    src={getAvatarUrl(user.profilePicture)}
                    alt={user?.name || 'Avatar'}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-[#1E73BE]"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#1E73BE] text-white flex items-center justify-center font-semibold text-xl md:text-2xl">
                    {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                  </div>
                )}
              </div>
              <input
                id="profile-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <label
                htmlFor="profile-photo-upload"
                className={`px-3 md:px-4 py-2 rounded font-medium text-xs md:text-sm cursor-pointer ${
                  uploadingPhoto
                    ? 'opacity-60 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-[#383838] text-gray-300 hover:bg-[#454545]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {uploadingPhoto ? 'Upload en cours…' : 'Changer la photo'}
              </label>
              {user?.profilePicture && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={uploadingPhoto}
                  className={`mt-2 text-xs md:text-sm ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                >
                  Supprimer
                </button>
              )}
              <p className={`text-xs mt-2 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                JPG, PNG, GIF • max 5 Mo
              </p>
            </section>
          </div>
          {/* Préférences */}
          <section className={`rounded-xl shadow p-4 md:p-6 mt-2 md:mt-4 ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
            <h2 className={`font-semibold text-base md:text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Préférences</h2>
            <p className={`mb-3 md:mb-4 text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gérez vos paramètres de notification, de sécurité et de confidentialité.</p>
            <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
              <button onClick={() => setTab("profile")} className={`px-3 md:px-4 py-2 rounded-t font-medium text-xs md:text-sm ${tab === "profile" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Profil</button>
              <button onClick={() => setTab("notifications")} className={`px-3 md:px-4 py-2 rounded-t font-medium text-xs md:text-sm ${tab === "notifications" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Notifications</button>
              <button onClick={() => setTab("securite")} className={`px-3 md:px-4 py-2 rounded-t font-medium text-xs md:text-sm ${tab === "securite" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Sécurité</button>
              <button onClick={() => setTab("confidentialite")} className={`px-3 md:px-4 py-2 rounded-t font-medium text-xs md:text-sm ${tab === "confidentialite" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Confidentialité</button>
            </div>
            {tab === "profile" && (
              <div className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Devise par défaut</label>
                    <select 
                      value={settings?.appearance?.currency || 'EUR'}
                      onChange={(e) => handleSettingsUpdate({ appearance: { currency: e.target.value } })}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-[#F5F7FA] text-black'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="EUR" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Euro (€)</option>
                      <option value="USD" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Dollar ($)</option>
                      <option value="GBP" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Livre Sterling (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Format de date</label>
                    <select 
                      value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => handleSettingsUpdate({ appearance: { dateFormat: e.target.value } })}
                      className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-[#F5F7FA] text-black'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="DD/MM/YYYY" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>DD/MM/YYYY (26/07/2024)</option>
                      <option value="MM/DD/YYYY" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>MM/DD/YYYY (07/26/2024)</option>
                      <option value="YYYY-MM-DD" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>YYYY-MM-DD (2024-07-26)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Langue</label>
                  <select 
                    value={settings?.appearance?.language || 'fr'}
                    onChange={(e) => {
                      console.log('🌍 Changement de langue:', e.target.value);
                      handleSettingsUpdate({ appearance: { language: e.target.value } });
                    }}
                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-[#F5F7FA] text-black'}`}
                    style={isDarkMode ? { colorScheme: 'dark' } : {}}
                  >
                    <option value="fr" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Français</option>
                    <option value="en" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>English</option>
                    <option value="es" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Español</option>
                  </select>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Langue actuelle: {settings?.appearance?.language || 'fr'}
                  </div>
                </div>
              </div>
            )}
            {tab === "notifications" && (
              <div className="space-y-4 md:space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className={`font-medium text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications par e-mail</div>
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des mises à jour importantes et des résumés par e-mail.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings?.notifications?.email || false} 
                      onChange={() => handleSettingsUpdate({ notifications: { email: !settings?.notifications?.email } })} 
                      className="sr-only" 
                    />
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.notifications?.email ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.notifications?.email ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className={`font-medium text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications par SMS</div>
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des alertes rapides sur vos dépenses importantes.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings?.notifications?.sms || false} 
                      onChange={() => handleSettingsUpdate({ notifications: { sms: !settings?.notifications?.sms } })} 
                      className="sr-only" 
                    />
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.notifications?.sms ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.notifications?.sms ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-1">
                    <div className={`font-medium text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications push</div>
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des alertes directement sur votre appareil mobile ou votre navigateur.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings?.notifications?.push || false} 
                      onChange={() => handleSettingsUpdate({ notifications: { push: !settings?.notifications?.push } })} 
                      className="sr-only" 
                    />
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.notifications?.push ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.notifications?.push ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
              </div>
            )}
            {tab === "securite" && (
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Paramètres de sécurité à venir...</div>
            )}
            {tab === "confidentialite" && (
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Paramètres de confidentialité à venir...</div>
            )}
            {tab === "theme" && (
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Personnalisation du thème à venir...</div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage;
