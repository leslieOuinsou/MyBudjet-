import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader.jsx';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import Footer from '../components/Footer.jsx';
import Toast from '../components/Toast.jsx';
import { 
  MdPerson, 
  MdEmail, 
  MdPhone, 
  MdCameraAlt,
  MdDelete,
  MdSettings,
  MdNotifications,
  MdLanguage,
  MdSync,
  MdSecurity,
  MdLock,
  MdDownload,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdRefresh,
  MdVerifiedUser,
  MdDevices
} from 'react-icons/md';
import { 
  getUserSettings, 
  updateUserSettings, 
  changePassword, 
  updateUserProfile,
  deleteUserAccount,
  exportUserData,
  getCurrentUser,
  uploadAvatar,
  deleteAvatar
} from '../api.js';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toasts, setToasts] = useState([]);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // États pour les formulaires
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: ''
  });

  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isSyncing: false
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
        
        // Charger la dernière date de synchronisation
        const lastSyncStr = localStorage.getItem('lastSync');
        if (lastSyncStr) {
          setSyncStatus(prev => ({ ...prev, lastSync: new Date(lastSyncStr) }));
        }
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
      const updatedUser = await updateUserProfile(profileForm);
      
      // Mettre à jour l'utilisateur local
      setUser(prev => ({ ...prev, ...updatedUser }));
      
      addToast('✅ Profil mis à jour avec succès !', 'success');
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du profil';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  // Fonction pour ajouter un toast
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        addToast('❌ Les mots de passe ne correspondent pas', 'error');
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        addToast('❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      setError('');
      setIsChangingPassword(true);
      
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // Message de succès visible
      addToast('✅ Mot de passe changé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.', 'success');
      setSuccess('Mot de passe mis à jour avec succès');
      
      // Réinitialiser le formulaire
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors du changement de mot de passe';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAccountDelete = async (e) => {
    e.preventDefault();
    try {
      if (deleteForm.confirmation !== 'DELETE') {
        setError('Veuillez taper DELETE pour confirmer');
        return;
      }
      
      setError('');
      await deleteUserAccount(deleteForm.password, deleteForm.confirmation);
      // Rediriger vers la page de connexion après suppression
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression du compte');
    }
  };

  const handleSettingsUpdate = async (category, newSettings) => {
    try {
      setError('');
      setSuccess('');
      
      console.log('💾 Enregistrement de la préférence:', category, newSettings);
      
      await updateUserSettings({ [category]: newSettings });
      setSettings(prev => ({ ...prev, [category]: { ...prev[category], ...newSettings } }));
      
      // Toast de confirmation
      addToast('✅ Préférence enregistrée avec succès !', 'success');
      setSuccess('✅ Paramètres enregistrés avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
      console.log('✅ Préférence enregistrée');
    } catch (err) {
      console.error('❌ Erreur lors de l\'enregistrement:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour des paramètres';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(`❌ ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSync = async () => {
    if (syncStatus.isSyncing) return; // Empêcher les doubles clics
    
    try {
      setError('');
      setSuccess('');
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      
      console.log('🔄 Début de la synchronisation...');
      addToast('🔄 Synchronisation en cours...', 'info');
      
      // Simuler une synchronisation (recharger toutes les données)
      const [userData, settingsData] = await Promise.all([
        getCurrentUser(),
        getUserSettings()
      ]);
      
      setUser(userData);
      setSettings(settingsData);
      
      // Mettre à jour la date de dernière synchronisation
      const now = new Date();
      setSyncStatus({
        lastSync: now,
        isSyncing: false
      });
      
      // Sauvegarder dans localStorage
      localStorage.setItem('lastSync', now.toISOString());
      
      console.log('✅ Synchronisation terminée');
      addToast('✅ Synchronisation réussie !', 'success');
      setSuccess('✅ Données synchronisées avec succès');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation:', err);
      const errorMessage = err.message || 'Erreur lors de la synchronisation';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(`❌ ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleDataExport = async () => {
    try {
      setError('');
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mybudget-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('✅ Données exportées avec succès !', 'success');
      setSuccess('Données exportées avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'export des données';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    console.log('📸 Fichier sélectionné:', file);
    
    if (!file) return;

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    console.log('🔍 Type de fichier:', file.type, 'Valide:', validTypes.includes(file.type));
    
    if (!validTypes.includes(file.type)) {
      console.log('❌ Type de fichier non supporté');
      addToast('❌ Format non supporté. Utilisez JPG, PNG, GIF ou WebP', 'error');
      setError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    // Vérifier la taille (max 5MB)
    console.log('📏 Taille du fichier:', file.size, 'bytes (max: 5MB)');
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ Fichier trop volumineux');
      addToast('❌ L\'image est trop grande. Maximum 5MB', 'error');
      setError('L\'image est trop grande. Maximum 5MB');
      return;
    }

    try {
      setError('');
      console.log('🚀 Début de l\'upload...');
      const result = await uploadAvatar(file);
      console.log('✅ Résultat upload:', result);
      
      // Mettre à jour l'utilisateur local avec la nouvelle photo
      setUser(prev => ({ ...prev, profilePicture: result.profilePicture }));
      
      // Émettre un événement pour notifier les autres composants
      console.log('📡 Émission de l\'événement avatar-updated...');
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { profilePicture: result.profilePicture } 
      }));
      
      addToast('✅ Photo de profil mise à jour avec succès !', 'success');
      setSuccess('Photo de profil mise à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Erreur upload avatar:', err);
      const errorMessage = err.message || 'Erreur lors de l\'upload de la photo';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user?.profilePicture) {
      addToast('❌ Aucun avatar à supprimer', 'error');
      return;
    }

    // Demander confirmation
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
      return;
    }

    try {
      setError('');
      console.log('🗑️ Début de la suppression d\'avatar...');
      
      const result = await deleteAvatar();
      console.log('✅ Résultat suppression:', result);
      
      // Mettre à jour l'utilisateur local pour supprimer la photo
      setUser(prev => ({ ...prev, profilePicture: null }));
      
      // Émettre un événement pour notifier les autres composants
      console.log('📡 Émission de l\'événement avatar-updated (suppression)...');
      window.dispatchEvent(new CustomEvent('avatar-updated', { 
        detail: { profilePicture: null } 
      }));
      
      addToast('✅ Photo de profil supprimée avec succès !', 'success');
      setSuccess('Photo de profil supprimée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ Erreur suppression avatar:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression de la photo';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#1E73BE] mx-auto mb-4"></div>
            <MdSettings className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#1E73BE]" size={24} />
          </div>
          <p className="text-gray-600 font-medium">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        <DashboardSidebar />
        {/* Main content */}
        <main className="flex-1 py-8 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full">
          {/* Header moderne */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-[#1E73BE] to-[#155a8a] rounded-xl shadow-lg">
                <MdSettings className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1E73BE] to-[#155a8a] bg-clip-text text-transparent">
                  Paramètres
                </h1>
                <p className="text-gray-600 text-sm">
                  Gérez votre profil, vos préférences et vos options de synchronisation
                  {user && ` • Bonjour ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
                </p>
              </div>
            </div>
          </div>

          {/* Messages d'erreur et de succès modernisés */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-lg flex items-start gap-4 animate-slide-down">
              <MdError className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <p className="font-bold text-red-900 mb-1">Erreur</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-600 hover:text-red-800 hover:bg-red-200 rounded-full p-1 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-xl mb-6 shadow-lg flex items-start gap-4 animate-slide-down">
              <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <p className="font-bold text-green-900 mb-1">Succès</p>
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-1 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Gestion du profil */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <MdPerson className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Gestion du profil</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              {/* Avatar avec option d'upload */}
              <div className="relative group">
                {user?.profilePicture ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${user.profilePicture}`} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1E73BE] to-[#155a8a] text-white flex items-center justify-center font-bold text-2xl shadow-xl group-hover:scale-105 transition-transform duration-300">
                    {user ? (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U') : 'U'}
                  </div>
                )}
                {/* Badge pour changer l'avatar */}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#1E73BE] to-[#155a8a] text-white rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:from-[#155a8a] hover:to-[#0d4a6f] shadow-lg hover:scale-110 transition-all duration-300 border-2 border-white"
                  title="Changer l'avatar"
                >
                  <MdCameraAlt size={18} />
                </label>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-xl mb-1">{user?.name || 'Utilisateur'}</div>
                <div className="text-gray-600 text-sm mb-4 flex items-center gap-2">
                  <MdEmail size={16} className="text-[#1E73BE]" />
                  {user?.email || 'email@exemple.com'}
                </div>
                <div className="flex flex-wrap gap-3">
                  <label 
                    htmlFor="avatar-upload" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#1E73BE] rounded-lg hover:bg-blue-50 cursor-pointer transition-colors text-sm font-medium border border-blue-200 shadow-sm hover:shadow-md"
                  >
                    <MdCameraAlt size={16} />
                    Changer l'avatar
                  </label>
                  {user?.profilePicture && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 cursor-pointer transition-colors text-sm font-medium border border-red-200 shadow-sm hover:shadow-md"
                    >
                      <MdDelete size={16} />
                      Supprimer
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <MdInfo size={14} />
                  Formats acceptés: JPG, PNG, GIF ou WebP (max 5MB)
                </p>
              </div>
            </div>
            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                  <MdPerson size={16} className="text-[#1E73BE]" />
                  Nom complet
                </label>
                <input 
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all bg-white shadow-sm hover:shadow-md" 
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                  <MdEmail size={16} className="text-[#1E73BE]" />
                  Adresse e-mail
                </label>
                <input 
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all bg-white shadow-sm hover:shadow-md" 
                  placeholder="votre@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                  <MdPhone size={16} className="text-[#1E73BE]" />
                  Numéro de téléphone
                </label>
                <input 
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all bg-white shadow-sm hover:shadow-md" 
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#1E73BE] to-[#155a8a] text-white px-8 py-3 rounded-xl font-semibold hover:from-[#155a8a] hover:to-[#0d4a6f] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                >
                  <MdCheckCircle size={20} />
                  Mettre à jour le profil
                </button>
              </div>
            </form>
          </section>

          {/* Préférences de l'application */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <MdSettings className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Préférences de l'application</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <MdNotifications className="text-purple-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Alertes budgétaires</div>
                      <div className="text-gray-600 text-sm">Recevez des notifications lorsque vous dépassez vos limites budgétaires.</div>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings?.notifications?.email || false} 
                      onChange={() => handleSettingsUpdate('notifications', { 
                        email: !settings?.notifications?.email 
                      })} 
                    />
                    <span className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 transition-all ${settings?.notifications?.email ? 'bg-gradient-to-r from-[#1E73BE] to-[#155a8a]' : 'bg-gray-300'}`}>
                      <span className={`bg-white w-5 h-5 rounded-full shadow-lg transform duration-300 transition-all ${settings?.notifications?.email ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <span className="text-lg">💶</span>
                    Devise par défaut
                  </label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm hover:shadow-md"
                    value={settings?.appearance?.currency || 'EUR'}
                    onChange={(e) => handleSettingsUpdate('appearance', { currency: e.target.value })}
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                    <option value="GBP">Livre Sterling (£)</option>
                    <option value="JPY">Yen (¥)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <span className="text-lg">📅</span>
                    Format de la date
                  </label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm hover:shadow-md"
                    value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleSettingsUpdate('appearance', { dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (26/07/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (07/26/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-07-26)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <MdLanguage size={16} className="text-[#1E73BE]" />
                    Langue de l'interface
                  </label>
                  <select 
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-[#1E73BE] focus:ring-2 focus:ring-blue-100 transition-all shadow-sm hover:shadow-md"
                    value={settings?.appearance?.language || 'fr'}
                    onChange={(e) => handleSettingsUpdate('appearance', { language: e.target.value })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div className="pt-6 border-t-2 border-gray-200 mt-6">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <MdInfo className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Astuce :</span> Vos préférences sont enregistrées automatiquement à chaque modification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Options de synchronisation */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <MdSync className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Options de synchronisation</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <MdSync className="text-green-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Synchronisation automatique</div>
                      <div className="text-gray-600 text-sm">Activer la synchronisation automatique de vos données entre les plateformes web et mobile.</div>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings?.data?.autoBackup || false} 
                      onChange={() => handleSettingsUpdate('data', { 
                        autoBackup: !settings?.data?.autoBackup 
                      })} 
                    />
                    <span className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 transition-all ${settings?.data?.autoBackup ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-300'}`}>
                      <span className={`bg-white w-5 h-5 rounded-full shadow-lg transform duration-300 transition-all ${settings?.data?.autoBackup ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </span>
                  </label>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MdInfo className="text-green-600" size={18} />
                    <div className="font-semibold text-gray-900">Dernière synchronisation</div>
                  </div>
                  <div className="text-gray-700 text-sm ml-6">
                    {syncStatus.lastSync ? (
                      <>
                        Synchronisé le <span className="font-semibold">{syncStatus.lastSync.toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}</span> à <span className="font-semibold">{syncStatus.lastSync.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 italic">Jamais synchronisé</span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={syncStatus.isSyncing || !settings?.data?.autoBackup}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl ${
                  syncStatus.isSyncing 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : settings?.data?.autoBackup
                      ? 'bg-gradient-to-r from-[#1E73BE] to-[#155a8a] hover:from-[#155a8a] hover:to-[#0d4a6f] text-white transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {syncStatus.isSyncing ? (
                  <>
                    <MdRefresh className="animate-spin" size={20} />
                    <span>Synchronisation...</span>
                  </>
                ) : settings?.data?.autoBackup ? (
                  <>
                    <MdSync size={20} />
                    <span>Synchroniser maintenant</span>
                  </>
                ) : (
                  <>
                    <MdInfo size={20} />
                    <span>Activez la synchro d'abord</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Sécurité du compte */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 mb-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                <MdSecurity className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sécurité du compte</h2>
            </div>
            
            {/* Formulaire de changement de mot de passe */}
            <form onSubmit={handlePasswordChange} className="mb-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-4">
                <MdLock className="text-red-600" size={20} />
                <h3 className="font-semibold text-gray-900">Changer le mot de passe</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <MdLock size={16} className="text-red-600" />
                    Mot de passe actuel
                  </label>
                  <input 
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all shadow-sm hover:shadow-md" 
                    placeholder="Mot de passe actuel"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <MdLock size={16} className="text-red-600" />
                    Nouveau mot de passe
                  </label>
                  <input 
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all shadow-sm hover:shadow-md" 
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                    minLength="6"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                    <MdLock size={16} className="text-red-600" />
                    Confirmer le mot de passe
                  </label>
                  <input 
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all shadow-sm hover:shadow-md" 
                    placeholder="Confirmer le mot de passe"
                    minLength="6"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <MdRefresh className="animate-spin" size={20} />
                    <span>Changement en cours...</span>
                  </>
                ) : (
                  <>
                    <MdLock size={20} />
                    <span>Changer le mot de passe</span>
                  </>
                )}
              </button>
              {/* Indicateur de sécurité du mot de passe */}
              {passwordForm.newPassword && (
                <div className="mt-3">
                  <div className="text-sm text-[#6C757D] mb-1">Force du mot de passe :</div>
                  <div className="flex gap-1">
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 6 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 8 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 10 && /[A-Z]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 12 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'bg-green-700' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-xs text-[#6C757D] mt-1">
                    {passwordForm.newPassword.length < 6 ? 'Trop faible' :
                     passwordForm.newPassword.length < 8 ? 'Faible' :
                     passwordForm.newPassword.length < 10 ? 'Moyen' :
                     /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'Très fort' : 'Fort'}
                  </p>
                </div>
              )}
            </form>

            {/* Export des données */}
            <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <MdDownload className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-900">Export des données</h3>
              </div>
              <p className="text-gray-700 text-sm mb-4">Téléchargez une copie de toutes vos données au format JSON.</p>
              <button 
                onClick={handleDataExport}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
              >
                <MdDownload size={20} />
                Exporter mes données
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <MdVerifiedUser className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Authentification à deux facteurs</div>
                      <div className="text-gray-600 text-sm">Ajoutez une couche de sécurité supplémentaire à votre compte.</div>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings?.security?.twoFactorAuth?.enabled || false} 
                      onChange={() => handleSettingsUpdate('security', { 
                        twoFactorAuth: { 
                          ...settings?.security?.twoFactorAuth, 
                          enabled: !settings?.security?.twoFactorAuth?.enabled 
                        } 
                      })} 
                    />
                    <span className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 transition-all ${settings?.security?.twoFactorAuth?.enabled ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'}`}>
                      <span className={`bg-white w-5 h-5 rounded-full shadow-lg transform duration-300 transition-all ${settings?.security?.twoFactorAuth?.enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </span>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-3 flex-1">
                    <MdDevices className="text-indigo-600 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Sessions actives</div>
                      <div className="text-gray-600 text-sm">Gérez les appareils connectés à votre compte.</div>
                    </div>
                  </div>
                  <button className="bg-white text-[#1E73BE] px-6 py-2 rounded-xl font-semibold border-2 border-[#1E73BE] hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    Voir les sessions
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Zone de Danger */}
          <section className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 rounded-2xl border-2 border-red-300 shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
                <MdWarning className="text-white" size={24} />
              </div>
              <h2 className="text-xl font-bold text-red-700">Zone de Danger</h2>
            </div>
            <div className="flex items-start gap-3 p-4 bg-red-100 rounded-xl border border-red-200 mb-6">
              <MdWarning className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">
                <span className="font-semibold">Attention :</span> Cette action supprimera définitivement toutes vos données et votre compte MyBudget+. Cette action est irréversible.
              </p>
            </div>
            <form onSubmit={handleAccountDelete} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <MdLock size={16} />
                    Mot de passe
                  </label>
                  <input 
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                    className="w-full border-2 border-red-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all shadow-sm" 
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-red-700 text-sm font-medium">
                    <MdWarning size={16} />
                    Tapez DELETE pour confirmer
                  </label>
                  <input 
                    type="text"
                    value={deleteForm.confirmation}
                    onChange={(e) => setDeleteForm({...deleteForm, confirmation: e.target.value})}
                    className="w-full border-2 border-red-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all shadow-sm uppercase" 
                    placeholder="DELETE"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                disabled={deleteForm.confirmation !== 'DELETE'}
              >
                <MdDelete size={20} />
                Supprimer définitivement le compte
              </button>
            </form>
          </section>
        </main>
        {/* Sidebar mobile (déconnexion) */}
        <aside className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F5F7FA] p-4 flex justify-center">
          <button className="bg-[#DC3545] text-white px-6 py-2 rounded font-semibold hover:bg-[#b52a37] flex items-center gap-2">
            <span className="text-lg">⏻</span> Déconnexion
          </button>
        </aside>
      </div>
      {/* Footer */}
      <Footer />

      {/* Toasts pour les notifications */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
