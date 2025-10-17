import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../components/DashboardHeader.jsx';
import Toast from '../components/Toast.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { 
  getUserSettings, 
  updateUserSettings, 
  changePassword, 
  updateUserProfile,
  deleteUserAccount,
  exportUserData,
  getCurrentUser,
  uploadAvatar
} from '../api.js';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
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
    if (!file) return;

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast('❌ Format non supporté. Utilisez JPG, PNG, GIF ou WebP', 'error');
      setError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('❌ L\'image est trop grande. Maximum 5MB', 'error');
      setError('L\'image est trop grande. Maximum 5MB');
      return;
    }

    try {
      setError('');
      const result = await uploadAvatar(file);
      
      // Mettre à jour l'utilisateur local avec la nouvelle photo
      setUser(prev => ({ ...prev, profilePicture: result.profilePicture }));
      
      addToast('✅ Photo de profil mise à jour avec succès !', 'success');
      setSuccess('Photo de profil mise à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de l\'upload de la photo';
      addToast(`❌ ${errorMessage}`, 'error');
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-[#F5F7FA] py-8 px-6 hidden md:block">
          <div className="mb-8">
            <div className="text-xs text-[#6C757D] font-semibold mb-2">NAVIGATION</div>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Tableau de bord</Link></li>
              <li><Link to="/categories" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Catégories & Portefeuilles</Link></li>
              <li><Link to="/budgets" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Budgets</Link></li>
              <li><Link to="/transactions" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Transactions</Link></li>
              <li><Link to="/reports" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Rapports</Link></li>
              <li><Link to="/importexport" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Import/Export</Link></li>
              <li><Link to="/forecasts" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Prévisions</Link></li>
              <li><Link to="/notifications" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Notifications</Link></li>
              <li><Link to="/settings" className="block px-2 py-1 rounded bg-[#F5F7FA] text-[#1E73BE] font-semibold">Paramètres utilisateur</Link></li>
              <li><Link to="/profile" className="block px-2 py-1 rounded hover:bg-[#F5F7FA] text-[#343A40]">Mon Profil</Link></li>
            </ul>
          </div>
          <Link to="/login" className="mt-8 w-full bg-[#DC3545] text-white px-6 py-2 rounded font-semibold hover:bg-[#b52a37] flex items-center gap-2">
            <span className="text-lg">⏻</span> Déconnexion
          </Link>
        </aside>
        {/* Main content */}
        <main className="flex-1 py-10 px-4 md:px-12">
          <h1 className="text-2xl font-bold text-[#343A40] mb-1">Paramètres utilisateur</h1>
          <p className="text-[#6C757D] mb-8">
            Gérez votre profil, vos préférences et vos options de synchronisation.
            {user && ` Bonjour ${user.name?.split(' ')[0] || 'Utilisateur'} !`}
          </p>

          {/* Messages d'erreur et de succès */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4 shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <p className="font-bold">Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-700 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100 text-xl">✕</button>
            </div>
          )}
          {success && (
            <div className="bg-green-100 dark:bg-green-900 border-l-4 border-green-500 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4 shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <p className="font-bold">Succès</p>
                <p className="text-sm">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-green-700 dark:text-green-200 hover:text-green-900 dark:hover:text-green-100 text-xl">✕</button>
            </div>
          )}

          {/* Gestion du profil */}
          <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#F5F7FA] dark:border-[#404040] p-6 mb-8">
            <h2 className="font-semibold text-[#343A40] dark:text-[#e4e4e4] mb-4">Gestion du profil</h2>
            <div className="flex items-center gap-4 mb-6">
              {/* Avatar avec option d'upload */}
              <div className="relative">
                {user?.profilePicture ? (
                  <img 
                    src={`http://localhost:3001${user.profilePicture}`} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#1E73BE]" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1E73BE] text-white flex items-center justify-center font-semibold text-lg">
                    {user ? (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U') : 'U'}
                  </div>
                )}
                {/* Badge pour changer l'avatar */}
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute -bottom-1 -right-1 bg-[#1E73BE] text-white rounded-full w-6 h-6 flex items-center justify-center cursor-pointer hover:bg-[#155a8a] shadow-lg"
                  title="Changer l'avatar"
                >
                  📷
                </label>
                <input 
                  id="avatar-upload"
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <div className="font-semibold text-[#343A40] dark:text-[#e4e4e4]">{user?.name || 'Utilisateur'}</div>
                <div className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">{user?.email || 'email@exemple.com'}</div>
                <label 
                  htmlFor="avatar-upload" 
                  className="mt-2 inline-block text-xs text-[#1E73BE] hover:underline cursor-pointer"
                >
                  📷 Changer l'avatar
                </label>
                <p className="text-xs text-[#6C757D] dark:text-[#b0b0b0] mt-1">JPG, PNG, GIF ou WebP (max 5MB)</p>
              </div>
            </div>
            <form onSubmit={handleProfileUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#6C757D] text-sm mb-1">Nom complet</label>
                <input 
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 text-[#343A40] focus:outline-none focus:border-[#1E73BE]" 
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <label className="block text-[#6C757D] text-sm mb-1">Adresse e-mail</label>
                <input 
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 text-[#343A40] focus:outline-none focus:border-[#1E73BE]" 
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-[#6C757D] text-sm mb-1">Numéro de téléphone</label>
                <input 
                  type="tel"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                  className="w-full border border-[#F5F7FA] rounded px-3 py-2 text-[#343A40] focus:outline-none focus:border-[#1E73BE]" 
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="bg-[#1E73BE] text-white px-6 py-2 rounded font-semibold hover:bg-[#155a8a]">
                  Mettre à jour le profil
                </button>
              </div>
            </form>
          </section>

          {/* Préférences de l’application */}
          <section className="bg-white rounded-lg border border-[#F5F7FA] p-6 mb-8">
            <h2 className="font-semibold text-[#343A40] mb-4">Préférences de l’application</h2>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#343A40] dark:text-[#e4e4e4]">Mode Thème</div>
                    <div className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">Choisissez entre le mode clair, sombre ou automatique.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={theme}
                      onChange={async (e) => {
                        const newTheme = e.target.value;
                        const result = await toggleTheme(newTheme);
                        
                        if (result?.success) {
                          const themeLabels = {
                            light: 'Clair ☀️',
                            dark: 'Sombre 🌙',
                            auto: 'Automatique 🔄'
                          };
                          addToast(`✅ Thème ${themeLabels[newTheme]} activé !`, 'success');
                          setSuccess(`✅ Thème ${themeLabels[newTheme]} appliqué avec succès`);
                          setTimeout(() => setSuccess(''), 3000);
                        } else {
                          addToast(`❌ ${result?.error || 'Erreur lors du changement de thème'}`, 'error');
                          setError(`❌ ${result?.error || 'Erreur lors du changement de thème'}`);
                          setTimeout(() => setError(''), 5000);
                        }
                      }}
                      className="border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-white dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] text-sm focus:outline-none focus:border-[#1E73BE]"
                    >
                      <option value="light">☀️ Clair</option>
                      <option value="auto">🔄 Auto</option>
                      <option value="dark">🌙 Sombre</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#343A40]">Alertes budgétaires</div>
                    <div className="text-[#6C757D] text-sm">Recevez des notifications lorsque vous dépassez vos limites budgétaires.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings?.notifications?.email || false} 
                      onChange={() => handleSettingsUpdate('notifications', { 
                        email: !settings?.notifications?.email 
                      })} 
                    />
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.notifications?.email ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.notifications?.email ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Devise par défaut</label>
                  <select 
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-[#F5F7FA] dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]"
                    value={settings?.appearance?.currency || 'EUR'}
                    onChange={(e) => handleSettingsUpdate('appearance', { currency: e.target.value })}
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                    <option value="GBP">Livre Sterling (£)</option>
                    <option value="JPY">Yen (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Format de la date</label>
                  <select 
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-[#F5F7FA] dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]"
                    value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleSettingsUpdate('appearance', { dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (26/07/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (07/26/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-07-26)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Langue de l'interface</label>
                  <select 
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-[#F5F7FA] dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]"
                    value={settings?.appearance?.language || 'fr'}
                    onChange={(e) => handleSettingsUpdate('appearance', { language: e.target.value })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div className="pt-4 border-t border-[#F5F7FA] dark:border-[#404040]">
                  <p className="text-xs text-[#6C757D] dark:text-[#b0b0b0] italic">
                    💡 Vos préférences sont enregistrées automatiquement à chaque modification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Options de synchronisation */}
          <section className="bg-white rounded-lg border border-[#F5F7FA] p-6 mb-8">
            <h2 className="font-semibold text-[#343A40] mb-4">Options de synchronisation</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#343A40]">Synchronisation automatique</div>
                    <div className="text-[#6C757D] text-sm">Activer la synchronisation automatique de vos données entre les plateformes web et mobile.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={settings?.data?.autoBackup || false} 
                      onChange={() => handleSettingsUpdate('data', { 
                        autoBackup: !settings?.data?.autoBackup 
                      })} 
                    />
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.data?.autoBackup ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.data?.autoBackup ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
                <div>
                  <div className="font-medium text-[#343A40] dark:text-[#e4e4e4]">Dernière synchronisation</div>
                  <div className="text-[#6C757D] dark:text-[#b0b0b0] text-sm">
                    {syncStatus.lastSync ? (
                      <>
                        Synchronisé le {syncStatus.lastSync.toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })} à {syncStatus.lastSync.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </>
                    ) : (
                      'Jamais synchronisé'
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSync}
                disabled={syncStatus.isSyncing || !settings?.data?.autoBackup}
                className={`px-6 py-2 rounded font-semibold transition-all duration-200 ${
                  syncStatus.isSyncing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : settings?.data?.autoBackup
                      ? 'bg-[#1E73BE] hover:bg-[#155a8a] text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {syncStatus.isSyncing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Synchronisation...
                  </span>
                ) : settings?.data?.autoBackup ? (
                  'Synchroniser maintenant'
                ) : (
                  'Activez la synchro d\'abord'
                )}
              </button>
            </div>
          </section>

          {/* Sécurité du compte */}
          <section className="bg-white dark:bg-[#2d2d2d] rounded-lg border border-[#F5F7FA] dark:border-[#404040] p-6 mb-8">
            <h2 className="font-semibold text-[#343A40] dark:text-[#e4e4e4] mb-4">Sécurité du compte</h2>
            
            {/* Formulaire de changement de mot de passe */}
            <form onSubmit={handlePasswordChange} className="mb-6">
              <h3 className="font-medium text-[#343A40] dark:text-[#e4e4e4] mb-3">Changer le mot de passe</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Mot de passe actuel</label>
                  <input 
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-white dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]" 
                    placeholder="Mot de passe actuel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Nouveau mot de passe</label>
                  <input 
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-white dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]" 
                    placeholder="Nouveau mot de passe (min. 6 caractères)"
                    minLength="6"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C757D] dark:text-[#b0b0b0] text-sm mb-1">Confirmer le mot de passe</label>
                  <input 
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full border border-[#F5F7FA] dark:border-[#404040] rounded px-3 py-2 bg-white dark:bg-[#383838] text-[#343A40] dark:text-[#e4e4e4] focus:outline-none focus:border-[#1E73BE]" 
                    placeholder="Confirmer le mot de passe"
                    minLength="6"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="mt-3 bg-[#1E73BE] text-white px-6 py-2 rounded font-semibold hover:bg-[#155a8a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Changement en cours...</span>
                  </>
                ) : (
                  <>
                    <span>🔐</span>
                    <span>Changer le mot de passe</span>
                  </>
                )}
              </button>
              {/* Indicateur de sécurité du mot de passe */}
              {passwordForm.newPassword && (
                <div className="mt-3">
                  <div className="text-sm text-[#6C757D] dark:text-[#b0b0b0] mb-1">Force du mot de passe :</div>
                  <div className="flex gap-1">
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 6 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 8 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 10 && /[A-Z]/.test(passwordForm.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-2 flex-1 rounded ${passwordForm.newPassword.length >= 12 && /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'bg-green-700' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-xs text-[#6C757D] dark:text-[#b0b0b0] mt-1">
                    {passwordForm.newPassword.length < 6 ? 'Trop faible' :
                     passwordForm.newPassword.length < 8 ? 'Faible' :
                     passwordForm.newPassword.length < 10 ? 'Moyen' :
                     /[A-Z]/.test(passwordForm.newPassword) && /[0-9]/.test(passwordForm.newPassword) && /[^A-Za-z0-9]/.test(passwordForm.newPassword) ? 'Très fort' : 'Fort'}
                  </p>
                </div>
              )}
            </form>

            {/* Export des données */}
            <div className="mb-6">
              <h3 className="font-medium text-[#343A40] mb-3">Export des données</h3>
              <p className="text-[#6C757D] text-sm mb-3">Téléchargez une copie de toutes vos données au format JSON.</p>
              <button 
                onClick={handleDataExport}
                className="bg-[#28A745] text-white px-6 py-2 rounded font-semibold hover:bg-[#218838]"
              >
                Exporter mes données
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#343A40]">Authentification à deux facteurs</div>
                    <div className="text-[#6C757D] text-sm">Ajoutez une couche de sécurité supplémentaire à votre compte.</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
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
                    <span className={`w-11 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 ${settings?.security?.twoFactorAuth?.enabled ? 'bg-[#1E73BE]' : ''}`}>
                      <span className={`bg-white w-4 h-4 rounded-full shadow transform duration-300 ${settings?.security?.twoFactorAuth?.enabled ? 'translate-x-5' : ''}`}></span>
                    </span>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#343A40]">Sessions actives</div>
                    <div className="text-[#6C757D] text-sm">Gérez les appareils connectés à votre compte.</div>
                  </div>
                  <button className="bg-[#F5F7FA] text-[#1E73BE] px-4 py-2 rounded font-semibold border border-[#F5F7FA] hover:bg-[#E9F7FB]">Voir les sessions actives</button>
                </div>
              </div>
            </div>
          </section>

          {/* Zone de Danger */}
          <section className="bg-[#FFF5F5] rounded-lg border border-[#DC3545] p-6 mb-8">
            <h2 className="font-semibold text-[#DC3545] mb-4">Zone de Danger</h2>
            <p className="text-[#DC3545] text-sm mb-4">Cette action supprimera toutes vos données et votre compte MyBudget+.</p>
            <form onSubmit={handleAccountDelete}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#6C757D] text-sm mb-1">Mot de passe</label>
                  <input 
                    type="password"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm({...deleteForm, password: e.target.value})}
                    className="w-full border border-[#DC3545] rounded px-3 py-2 text-[#343A40] focus:outline-none focus:border-[#DC3545]" 
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#6C757D] text-sm mb-1">Tapez DELETE pour confirmer</label>
                  <input 
                    type="text"
                    value={deleteForm.confirmation}
                    onChange={(e) => setDeleteForm({...deleteForm, confirmation: e.target.value})}
                    className="w-full border border-[#DC3545] rounded px-3 py-2 text-[#343A40] focus:outline-none focus:border-[#DC3545]" 
                    placeholder="DELETE"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="bg-[#DC3545] text-white px-6 py-2 rounded font-semibold hover:bg-[#b52a37]"
                disabled={deleteForm.confirmation !== 'DELETE'}
              >
                Supprimer le compte
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
      <footer className="bg-white border-t border-[#F5F7FA] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[#1E73BE] font-bold text-xl">MyBudget+</span>
          <div className="flex gap-6 text-[#6C757D] text-sm">
            <a href="#" className="hover:text-[#1E73BE]">Produit</a>
            <a href="#" className="hover:text-[#1E73BE]">Ressources</a>
            <a href="#" className="hover:text-[#1E73BE]">Légal</a>
          </div>
          <div className="flex gap-4 text-[#6C757D]">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
        <div className="text-center text-xs text-[#6C757D] mt-4">© 2024 MyBudget+. Tous droits réservés.</div>
      </footer>

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
