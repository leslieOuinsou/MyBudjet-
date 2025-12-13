import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { getUserSettings, updateUserSettings } from '../api.js';
import { 
  MdSettings, 
  MdDarkMode, 
  MdLightMode,
  MdLanguage,
  MdAttachMoney,
  MdCalendarToday,
  MdNotifications,
  MdSecurity,
  MdStorage,
  MdCheckCircle
} from 'react-icons/md';

export default function AdminSettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('appearance');
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getUserSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSettingsUpdate = async (category, newSettings) => {
    try {
      setError('');
      await updateUserSettings(category, newSettings);
      setSuccess('Paramètres mis à jour !');
      loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleThemeToggle = async () => {
    const result = await toggleTheme();
    if (result.success) {
      setSuccess('Thème mis à jour !');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Erreur lors du changement de thème');
    }
  };
  
  const tabs = [
    { id: 'appearance', label: 'Apparence', icon: MdDarkMode },
    { id: 'notifications', label: 'Notifications', icon: MdNotifications },
    { id: 'security', label: 'Sécurité', icon: MdSecurity },
    { id: 'data', label: 'Données', icon: MdStorage },
  ];
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
      <AdminHeader />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          <div className="max-w-5xl mx-auto">
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
              Paramètres Administrateur
            </h1>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
              Configurez vos préférences et paramètres système
            </p>
            
            {/* Messages */}
            {error && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-green-100 border border-green-300 text-green-700'}`}>
                ✅ {success}
              </div>
            )}
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#1E73BE] text-white'
                        : isDarkMode
                          ? 'bg-[#2d2d2d] text-gray-300 hover:bg-[#383838]'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* Contenu des tabs */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              {/* Apparence */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Apparence
                  </h3>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Thème
                    </label>
                    <button
                      onClick={handleThemeToggle}
                      className={`flex items-center gap-3 w-full p-4 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040]' : 'bg-gray-50 border-gray-200'}`}
                    >
                      {isDarkMode ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Cliquez pour basculer
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <MdLanguage className="inline mr-2" size={18} />
                      Langue
                    </label>
                    <select
                      value={settings?.appearance?.language || 'fr'}
                      onChange={(e) => handleSettingsUpdate('appearance', { language: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="fr" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Français</option>
                      <option value="en" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>English</option>
                      <option value="es" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Español</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <MdAttachMoney className="inline mr-2" size={18} />
                      Devise
                    </label>
                    <select
                      value={settings?.appearance?.currency || 'EUR'}
                      onChange={(e) => handleSettingsUpdate('appearance', { currency: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="EUR" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Euro (€)</option>
                      <option value="USD" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Dollar ($)</option>
                      <option value="GBP" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Livre (£)</option>
                      <option value="JPY" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Yen (¥)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <MdCalendarToday className="inline mr-2" size={18} />
                      Format de Date
                    </label>
                    <select
                      value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => handleSettingsUpdate('appearance', { dateFormat: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="DD/MM/YYYY" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          Notifications Email
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Recevoir des emails pour les événements importants
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.notifications?.email || false}
                          onChange={(e) => handleSettingsUpdate('notifications', { email: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          Notifications Push
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Notifications dans le navigateur
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.notifications?.push || false}
                          onChange={(e) => handleSettingsUpdate('notifications', { push: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-[#E3F2FD] border border-[#1E73BE]'}`}>
                      <div className="flex items-start gap-3">
                        <MdNotifications size={24} className="text-[#1E73BE] mt-0.5" />
                        <div>
                          <div className={`font-medium mb-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-900'}`}>
                            Notifications Admin
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            En tant qu'administrateur, vous recevez des notifications pour :
                          </div>
                          <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            <li>• Nouveaux utilisateurs inscrits</li>
                            <li>• Activités suspectes détectées</li>
                            <li>• Erreurs système critiques</li>
                            <li>• Mises à jour de sécurité</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sécurité */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Sécurité
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          Notifications de Connexion
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Recevoir un email à chaque connexion
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.security?.loginNotifications || false}
                          onChange={(e) => handleSettingsUpdate('security', { loginNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-start gap-3">
                        <MdSecurity size={24} className="text-red-600 mt-0.5" />
                        <div>
                          <div className={`font-medium mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                            Sécurité Renforcée Admin
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                            Votre compte bénéficie de mesures de sécurité supplémentaires :
                          </div>
                          <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                            <li>• Délai de session réduit (30 minutes)</li>
                            <li>• Surveillance des actions administratives</li>
                            <li>• Historique de connexion détaillé</li>
                            <li>• Protection contre les attaques par force brute</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Données */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Gestion des Données
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          Sauvegarde Automatique
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Sauvegarde automatique de vos préférences
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings?.data?.autoBackup || false}
                          onChange={(e) => handleSettingsUpdate('data', { autoBackup: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Fréquence de Sauvegarde
                      </label>
                      <select
                        value={settings?.data?.backupFrequency || 'weekly'}
                        onChange={(e) => handleSettingsUpdate('data', { backupFrequency: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                        style={isDarkMode ? { colorScheme: 'dark' } : {}}
                      >
                        <option value="daily" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Quotidienne</option>
                        <option value="weekly" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Hebdomadaire</option>
                        <option value="monthly" style={isDarkMode ? { backgroundColor: '#383838', color: 'white' } : {}}>Mensuelle</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

