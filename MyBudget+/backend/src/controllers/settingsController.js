import UserPreferences from '../models/userPreferences.js';
import User from '../models/user.js';
import bcrypt from 'bcrypt';

// Récupérer les préférences de l'utilisateur
export const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = await UserPreferences.getOrCreatePreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour les préférences de l'utilisateur
export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📝 Mise à jour des préférences pour user:', userId);
    console.log('📦 Données reçues:', JSON.stringify(req.body, null, 2));

    let userPreferences = await UserPreferences.getOrCreatePreferences(userId);
    
    console.log('📋 Préférences actuelles:', JSON.stringify(userPreferences.toObject(), null, 2));
    
    // Mise à jour de toutes les catégories envoyées
    for (const [category, newSettings] of Object.entries(req.body)) {
      if (userPreferences[category] !== undefined) {
        console.log(`✏️ Mise à jour de ${category}:`, newSettings);
        await userPreferences.updatePreferences(category, newSettings);
      }
    }

    // Recharger pour obtenir les dernières données
    userPreferences = await UserPreferences.findOne({ user: userId });
    
    console.log('✅ Préférences mises à jour:', JSON.stringify(userPreferences.toObject(), null, 2));

    res.json(userPreferences);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Changer le mot de passe
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Hacher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour les informations de profil
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer le compte
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.user._id;

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Confirmation incorrecte' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Supprimer l'utilisateur et ses données associées
    await User.findByIdAndDelete(userId);
    await UserPreferences.findOneAndDelete({ user: userId });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Exporter les données utilisateur
export const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('-password');
    const preferences = await UserPreferences.findOne({ user: userId });

    const exportData = {
      user: user,
      preferences: preferences,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    res.json(exportData);
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Uploader une photo de profil
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    // Construire l'URL de l'image
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ 
      message: 'Photo de profil mise à jour avec succès',
      profilePicture: profilePictureUrl,
      user
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
