import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  getCurrentUser,
  updateUserProfile,
  getUserSettings,
  updateUserSettings
} from '../api.js';
import { useTheme } from '../context/ThemeContext';

const UserProfilePage = () => {
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState("profile");
  
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
      await updateUserProfile(profileForm);
      setSuccess('Profil mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
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
        {/* Sidebar */}
        <aside className={`w-64 py-8 px-6 hidden md:block ${isDarkMode ? 'bg-[#2d2d2d] border-r border-[#404040]' : 'bg-white border-r border-[#F5F7FA]'}`}>
          <div className="mb-8">
            <div className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>NAVIGATION</div>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Tableau de bord</Link></li>
              <li><Link to="/categories" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Catégories & Portefeuilles</Link></li>
              <li><Link to="/budgets" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Budgets</Link></li>
              <li><Link to="/transactions" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Transactions</Link></li>
              <li><Link to="/reports" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Rapports</Link></li>
              <li><Link to="/importexport" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Import/Export</Link></li>
              <li><Link to="/forecasts" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Prévisions</Link></li>
              <li><Link to="/notifications" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Notifications</Link></li>
              <li><Link to="/settings" className={`block px-2 py-1 rounded ${isDarkMode ? 'text-gray-300 hover:bg-[#383838]' : 'text-[#343A40] hover:bg-[#F5F7FA]'}`}>Paramètres utilisateur</Link></li>
              <li><Link to="/profile" className={`block px-2 py-1 rounded font-semibold ${isDarkMode ? 'bg-[#383838] text-[#1E73BE]' : 'bg-[#F5F7FA] text-[#1E73BE]'}`}>Mon Profil</Link></li>
            </ul>
          </div>
          <Link to="/login" className="mt-8 w-full bg-[#DC3545] text-white px-6 py-2 rounded font-semibold hover:bg-[#b52a37] flex items-center gap-2">
            <span className="text-lg">⏻</span> Déconnexion
          </Link>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-10">
          <h1 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Mon Profil</h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
          <div className="flex flex-wrap gap-8 mb-8">
            {/* Infos personnelles */}
            <section className={`rounded-xl shadow p-6 flex-1 min-w-[320px] max-w-md ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Informations Personnelles</h2>
                <button className="text-[#1E73BE] text-sm font-medium">Modifier</button>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-3">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Nom complet</label>
                  <input 
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className={`border rounded px-3 py-2 w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Email</label>
                  <input 
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className={`border rounded px-3 py-2 w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Téléphone</label>
                  <input 
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                    className={`border rounded px-3 py-2 w-full focus:outline-none focus:border-[#1E73BE] ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white placeholder-gray-500' : 'bg-white border-gray-300 text-black'}`}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <button type="submit" className="w-full bg-[#1E73BE] text-white px-4 py-2 rounded font-semibold hover:bg-[#155a8a]">
                  Mettre à jour le profil
                </button>
              </form>
            </section>
            {/* Photo de profil */}
            <section className={`rounded-xl shadow p-6 flex flex-col items-center min-w-[260px] max-w-xs ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
              <h2 className={`font-semibold text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Photo de Profil</h2>
              <div className="w-24 h-24 rounded-full bg-[#1E73BE] text-white flex items-center justify-center font-semibold text-2xl mb-4">
                {user ? (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U') : 'U'}
              </div>
              <button className={`px-4 py-2 rounded font-medium text-sm ${isDarkMode ? 'bg-[#383838] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Changer la photo</button>
            </section>
          </div>
          {/* Préférences */}
          <section className={`rounded-xl shadow p-6 mt-4 ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'}`}>
            <h2 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Préférences</h2>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gérez vos paramètres de notification, de sécurité et de confidentialité.</p>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setTab("profile")} className={`px-4 py-2 rounded-t font-medium text-sm ${tab === "profile" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Profil</button>
              <button onClick={() => setTab("notifications")} className={`px-4 py-2 rounded-t font-medium text-sm ${tab === "notifications" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Notifications</button>
              <button onClick={() => setTab("securite")} className={`px-4 py-2 rounded-t font-medium text-sm ${tab === "securite" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Sécurité</button>
              <button onClick={() => setTab("confidentialite")} className={`px-4 py-2 rounded-t font-medium text-sm ${tab === "confidentialite" ? "bg-[#1E73BE] text-white" : isDarkMode ? "bg-[#383838] text-gray-300" : "bg-gray-100 text-gray-600"}`}>Confidentialité</button>
            </div>
            {tab === "profile" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Devise par défaut</label>
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
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Format de date</label>
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
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>Langue</label>
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
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications par e-mail</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des mises à jour importantes et des résumés par e-mail.</div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications par SMS</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des alertes rapides sur vos dépenses importantes.</div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>Notifications push</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recevez des alertes directement sur votre appareil mobile ou votre navigateur.</div>
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
      {/* Footer */}
      <footer className={`flex items-center justify-between px-8 py-3 border-t mt-auto ${isDarkMode ? 'bg-[#2d2d2d] border-[#404040]' : 'bg-white border-gray-200'}`}>
        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Made with <span className="text-[#1E73BE]">❤️</span></div>
        <div className={`flex gap-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <a href="#" className="hover:underline">Ressources</a>
          <a href="#" className="hover:underline">Légal</a>
          <a href="#" className="hover:underline">Nous Contacter</a>
        </div>
        <div className={`flex gap-4 text-lg ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>⚡</span>
          <span>🔒</span>
          <span>👥</span>
        </div>
      </footer>
    </div>
  );
};

export default UserProfilePage;
