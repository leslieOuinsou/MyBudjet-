import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AdminHeader from '../components/AdminHeader';
import AdminSidebar from '../components/AdminSidebar';
import { getCurrentUser, updateUserProfile, uploadProfilePicture } from '../api.js';
import { 
  MdPerson, 
  MdEmail, 
  MdAdminPanelSettings,
  MdCalendarToday,
  MdSave,
  MdCancel,
  MdEdit,
  MdCheckCircle,
  MdCamera
} from 'react-icons/md';

export default function AdminProfilePage() {
  const { isDarkMode } = useTheme();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation mot de passe
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      const updateData = {
        name: formData.name,
      };
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      await updateUserProfile(updateData);
      setSuccess('Profil mis à jour avec succès !');
      setEditing(false);
      loadUser();
      
      // Réinitialiser les champs de mot de passe
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validation
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5 Mo');
      return;
    }
    
    try {
      setUploadingPhoto(true);
      setError('');
      
      await uploadProfilePicture(file);
      setSuccess('Photo de profil mise à jour !');
      loadUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#F5F7FA]'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E73BE] mx-auto mb-4"></div>
          <p className={isDarkMode ? 'text-gray-300' : 'text-[#6C757D]'}>Chargement du profil...</p>
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
          <div className="max-w-4xl mx-auto">
            <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-[#22292F]'}`}>
              Mon Profil Administrateur
            </h1>
            <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-[#6C757D]'}`}>
              Gérez vos informations personnelles et vos identifiants
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
            
            {/* Badge Admin */}
            <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-gradient-to-r from-purple-900/20 to-purple-700/20 border border-purple-700' : 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200'}`}>
              <div className="flex items-center gap-3">
                <MdAdminPanelSettings size={32} className="text-purple-600" />
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-900'}`}>
                    Compte Administrateur
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Vous disposez des privilèges administrateur complets sur la plateforme
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo de profil */}
              <div className={`lg:col-span-1 p-6 rounded-lg h-fit ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Photo de Profil
                </h3>
                
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-bold text-3xl border-4 border-purple-400">
                        {getInitials(user?.name)}
                      </div>
                    )}
                    
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full cursor-pointer hover:bg-purple-700 transition shadow-lg"
                    >
                      {uploadingPhoto ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <MdCamera size={20} />
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </div>
                  
                  <p className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Cliquez sur l'appareil photo pour changer votre photo
                  </p>
                  <p className={`text-center text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Max 5 Mo • JPG, PNG, GIF
                  </p>
                </div>
              </div>
              
              {/* Informations personnelles */}
              <div className={`lg:col-span-2 p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Informations Personnelles
                  </h3>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 text-[#1E73BE] hover:underline"
                    >
                      <MdEdit size={18} />
                      Modifier
                    </button>
                  )}
                </div>
                
                {editing ? (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-gray-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                        />
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          L'email ne peut pas être modifié
                        </p>
                      </div>
                      
                      <hr className={`my-4 ${isDarkMode ? 'border-[#404040]' : 'border-gray-200'}`} />
                      
                      <h4 className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        Changer le mot de passe (optionnel)
                      </h4>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Mot de passe actuel
                        </label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                          minLength={12}
                        />
                      </div>
                      
                      <div>
                        <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Confirmer le nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-[#383838] border-[#404040] text-white' : 'bg-white border-gray-300 text-black'}`}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        className="flex items-center gap-2 bg-[#1E73BE] text-white px-6 py-2 rounded-lg hover:bg-[#155a8a] transition"
                      >
                        <MdSave size={20} />
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            name: user.name,
                            email: user.email,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg ${isDarkMode ? 'bg-[#383838] text-gray-300 hover:bg-[#404040]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        <MdCancel size={20} />
                        Annuler
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#383838]">
                      <MdPerson size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <div className="flex-1">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Nom</div>
                        <div className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {user?.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#383838]">
                      <MdEmail size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <div className="flex-1">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Email</div>
                        <div className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#383838]">
                      <MdAdminPanelSettings size={24} className="text-purple-600" />
                      <div className="flex-1">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Rôle</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            Administrateur
                          </span>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#383838]">
                      <MdCalendarToday size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                      <div className="flex-1">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Membre depuis</div>
                        <div className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Statistiques Admin */}
            <div className={`mt-6 p-6 rounded-lg ${isDarkMode ? 'bg-[#2d2d2d] border border-[#404040]' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Privilèges Administrateur
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MdCheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Gestion des utilisateurs
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Bloquer, débloquer, supprimer des comptes
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MdCheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Statistiques globales
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Accès aux données de tous les utilisateurs
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MdCheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Gestion des rôles
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Promouvoir/rétrograder des administrateurs
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MdCheckCircle size={20} className="text-green-600 mt-0.5" />
                  <div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Support technique
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Accès au support et à la documentation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

