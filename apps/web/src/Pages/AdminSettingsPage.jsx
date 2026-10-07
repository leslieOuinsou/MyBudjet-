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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#64748B] dark:text-[#94A3B8]'}>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC] dark:bg-[#0F172A]'}`}>
      <AdminHeader />
      
      <div className="flex flex-1">
        <AdminSidebar />
        
        <main className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 pt-16 md:pt-8">
          <div className="max-w-5xl mx-auto">
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#0F172A] dark:text-[#F8FAFC]'}`}>
              Paramètres Administrateur
            </h1>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
              Configurez vos préférences et paramètres système
            </p>
            
            {/* Messages */}
            {error && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700 text-red-400' : 'bg-red-100 dark:bg-[#7F1D1D]/50 border border-red-300 dark:border-[#991B1B] text-red-700 dark:text-[#FCA5A5]'}`}>
                ❌ {error}
              </div>
            )}
            {success && (
              <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-green-100 dark:bg-[#14532D]/50 border border-green-300 dark:border-[#166534] text-green-700 dark:text-[#4ADE80]'}`}>
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
                        ? 'bg-[#2563EB] dark:bg-[#3B82F6] text-white'
                        : isDarkMode
                          ? 'bg-[#1E293B] text-gray-300 hover:bg-[#334155]'
                          : 'bg-white dark:bg-[#1E293B] text-gray-700 dark:text-[#E2E8F0] hover:bg-gray-100 dark:hover:bg-[#334155]'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* Contenu des tabs */}
            <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-[#334155]'}`}>
              {/* Apparence */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                    Apparence
                  </h3>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                      Thème
                    </label>
                    <button
                      onClick={handleThemeToggle}
                      className={`flex items-center gap-3 w-full p-4 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155]' : 'bg-gray-50 dark:bg-[#334155]/50 border-gray-200 dark:border-[#334155]'}`}
                    >
                      {isDarkMode ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
                      <div className="flex-1 text-left">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          {isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
                          Cliquez pour basculer
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                      <MdLanguage className="inline mr-2" size={18} />
                      Langue
                    </label>
                    <select
                      value={settings?.appearance?.language || 'fr'}
                      onChange={(e) => handleSettingsUpdate('appearance', { language: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="fr" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Français</option>
                      <option value="en" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>English</option>
                      <option value="es" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Español</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                      <MdAttachMoney className="inline mr-2" size={18} />
                      Devise
                    </label>
                    <select
                      value={settings?.appearance?.currency || 'EUR'}
                      onChange={(e) => handleSettingsUpdate('appearance', { currency: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="EUR" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Euro (€)</option>
                      <option value="USD" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Dollar ($)</option>
                      <option value="GBP" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Livre (£)</option>
                      <option value="JPY" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Yen (¥)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                      <MdCalendarToday className="inline mr-2" size={18} />
                      Format de Date
                    </label>
                    <select
                      value={settings?.appearance?.dateFormat || 'DD/MM/YYYY'}
                      onChange={(e) => handleSettingsUpdate('appearance', { dateFormat: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                      style={isDarkMode ? { colorScheme: 'dark' } : {}}
                    >
                      <option value="DD/MM/YYYY" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                    Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#334155]/50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          Notifications Email
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-[#334155] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-[#1E293B] after:border-gray-300 dark:after:border-[#475569] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#334155]/50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          Notifications Push
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-[#334155] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-[#1E293B] after:border-gray-300 dark:after:border-[#475569] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border border-purple-700' : 'bg-[#DBEAFE] dark:bg-[#1E40AF] border border-[#2563EB]'}`}>
                      <div className="flex items-start gap-3">
                        <MdNotifications size={24} className="text-[#2563EB] dark:text-[#60A5FA] mt-0.5" />
                        <div>
                          <div className={`font-medium mb-1 ${isDarkMode ? 'text-purple-400' : 'text-[#2563EB] dark:text-[#60A5FA]'}`}>
                            Notifications Admin
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
                            En tant qu'administrateur, vous recevez des notifications pour :
                          </div>
                          <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-purple-300' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
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
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                    Sécurité
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#334155]/50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          Notifications de Connexion
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-[#334155] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-[#1E293B] after:border-gray-300 dark:after:border-[#475569] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 dark:bg-[#7F1D1D]/30 border border-red-200 dark:border-[#7F1D1D]'}`}>
                      <div className="flex items-start gap-3">
                        <MdSecurity size={24} className="text-[#2563EB] dark:text-[#60A5FA] mt-0.5" />
                        <div>
                          <div className={`font-medium mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                            Sécurité Renforcée Admin
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700 dark:text-[#FCA5A5]'}`}>
                            Votre compte bénéficie de mesures de sécurité supplémentaires :
                          </div>
                          <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? 'text-red-300' : 'text-red-700 dark:text-[#FCA5A5]'}`}>
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
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                    Gestion des Données
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#334155]/50">
                      <div>
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black dark:text-[#F8FAFC]'}`}>
                          Sauvegarde Automatique
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-[#CBD5E1]'}`}>
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
                        <div className="w-11 h-6 bg-gray-200 dark:bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white dark:peer-checked:after:border-[#334155] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white dark:after:bg-[#1E293B] after:border-gray-300 dark:after:border-[#475569] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-[#3B82F6]"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700 dark:text-[#E2E8F0]'}`}>
                        Fréquence de Sauvegarde
                      </label>
                      <select
                        value={settings?.data?.backupFrequency || 'weekly'}
                        onChange={(e) => handleSettingsUpdate('data', { backupFrequency: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-[#334155] border-[#334155] text-white' : 'bg-white dark:bg-[#1E293B] border-gray-300 dark:border-[#475569] text-black dark:text-[#F8FAFC]'}`}
                        style={isDarkMode ? { colorScheme: 'dark' } : {}}
                      >
                        <option value="daily" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Quotidienne</option>
                        <option value="weekly" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Hebdomadaire</option>
                        <option value="monthly" style={isDarkMode ? { backgroundColor: '#334155', color: 'white' } : {}}>Mensuelle</option>
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

