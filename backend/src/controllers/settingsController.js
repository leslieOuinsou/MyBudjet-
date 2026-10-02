import prisma from '../lib/prisma.js';
import { serialize, userId as getUserId } from '../lib/serialize.js';
import {
  isCloudinaryConfigured,
  isCloudinaryUrl,
  uploadImageToCloudinary,
  deleteCloudinaryImage,
} from '../lib/cloudinary.js';
import bcrypt from 'bcryptjs';

const DEFAULT_USER_PREFERENCES = {
  appearance: { theme: 'light', language: 'fr', currency: 'EUR', dateFormat: 'DD/MM/YYYY' },
  privacy: { profileVisibility: 'private', dataSharing: false, analytics: true },
  security: {
    twoFactorAuth: { enabled: false, method: 'email' },
    sessionTimeout: 30,
    loginNotifications: true,
  },
  notifications: { email: true, push: true, sms: false, frequency: 'immediate' },
  data: { autoBackup: true, backupFrequency: 'weekly', dataRetention: 365 },
};

const PREF_CATEGORIES = ['appearance', 'privacy', 'security', 'notifications', 'data'];

async function getOrCreateUserPreferences(uid) {
  let prefs = await prisma.userPreferences.findUnique({ where: { userId: uid } });
  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: {
        userId: uid,
        ...DEFAULT_USER_PREFERENCES,
      },
    });
  }
  return prefs;
}

function mergeJson(current, incoming) {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
  return { ...base, ...incoming };
}

export const getUserPreferences = async (req, res) => {
  try {
    const uid = getUserId(req.user);
    const preferences = await getOrCreateUserPreferences(uid);
    res.json(serialize(preferences));
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const uid = getUserId(req.user);

    console.log('📝 Mise à jour des préférences pour user:', uid);
    console.log('📦 Données reçues:', JSON.stringify(req.body, null, 2));

    let userPreferences = await getOrCreateUserPreferences(uid);

    console.log('📋 Préférences actuelles:', JSON.stringify(userPreferences, null, 2));

    const updateData = {};
    for (const [category, newSettings] of Object.entries(req.body)) {
      if (PREF_CATEGORIES.includes(category) && newSettings && typeof newSettings === 'object') {
        console.log(`✏️ Mise à jour de ${category}:`, newSettings);
        updateData[category] = mergeJson(userPreferences[category], newSettings);
      }
    }

    if (Object.keys(updateData).length > 0) {
      userPreferences = await prisma.userPreferences.update({
        where: { userId: uid },
        data: updateData,
      });
    }

    console.log('✅ Préférences mises à jour:', JSON.stringify(userPreferences, null, 2));

    res.json(serialize(userPreferences));
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = getUserId(req.user);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: uid },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const uid = getUserId(req.user);

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    try {
      const user = await prisma.user.update({
        where: { id: uid },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          profilePicture: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json(serialize(user));
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    const uid = getUserId(req.user);

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ message: 'Confirmation incorrecte' });
    }

    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    await prisma.userPreferences.deleteMany({ where: { userId: uid } });
    await prisma.user.delete({ where: { id: uid } });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const exportUserData = async (req, res) => {
  try {
    const uid = getUserId(req.user);

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        profilePicture: true,
        role: true,
        emailVerified: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const preferences = await prisma.userPreferences.findUnique({ where: { userId: uid } });

    const exportData = {
      user: serialize(user),
      preferences: serialize(preferences),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };

    res.json(exportData);
  } catch (error) {
    console.error("Erreur lors de l'export des données:", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    console.log('📸 Upload d\'avatar démarré pour utilisateur:', getUserId(req.user));
    console.log('📁 Fichier reçu:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    } : 'Aucun fichier');

    const uid = getUserId(req.user);

    if (!req.file) {
      console.log('❌ Aucun fichier uploadé');
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    let profilePictureUrl;

    if (isCloudinaryConfigured()) {
      // Stockage externe Cloudinary (production Vercel et/ou local)
      const result = await uploadImageToCloudinary(req.file, 'avatars');
      profilePictureUrl = result.secure_url;
      console.log('☁️ Avatar uploadé sur Cloudinary:', result.public_id);
    } else if (req.file.path && req.file.filename) {
      // Développement local sans Cloudinary : disque + express.static
      profilePictureUrl = `/uploads/${req.file.filename}`;
    } else {
      console.warn('⚠️ Fichier reçu en mémoire sans stockage externe configuré (Cloudinary)');
      return res.status(501).json({
        message: "L'upload de photos de profil nécessite un service de stockage externe en production. Veuillez configurer Cloudinary (variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
      });
    }

    console.log('🔗 URL de l\'avatar:', profilePictureUrl);

    // Supprimer l'ancien avatar Cloudinary éventuel (best-effort)
    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { profilePicture: true },
    });
    if (isCloudinaryUrl(existingUser?.profilePicture)) {
      try {
        await deleteCloudinaryImage(existingUser.profilePicture);
      } catch (err) {
        console.warn('⚠️ Impossible de supprimer l\'ancien avatar Cloudinary:', err.message);
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id: uid },
        data: { profilePicture: profilePictureUrl },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          profilePicture: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log('✅ Avatar mis à jour avec succès:', profilePictureUrl);

      res.json({
        message: 'Photo de profil mise à jour avec succès',
        profilePicture: profilePictureUrl,
        user: serialize(user),
      });
    } catch (error) {
      if (error.code === 'P2025') {
        console.log('❌ Utilisateur non trouvé:', uid);
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload de la photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    console.log('🗑️ Suppression d\'avatar pour utilisateur:', getUserId(req.user));

    const uid = getUserId(req.user);

    // Supprimer l'image distante si elle est hébergée sur Cloudinary (best-effort)
    const existingUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { profilePicture: true },
    });
    if (isCloudinaryUrl(existingUser?.profilePicture)) {
      try {
        await deleteCloudinaryImage(existingUser.profilePicture);
      } catch (err) {
        console.warn('⚠️ Impossible de supprimer l\'image Cloudinary:', err.message);
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id: uid },
        data: { profilePicture: null },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          profilePicture: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log('✅ Avatar supprimé avec succès pour:', user.name);

      res.json({
        message: 'Photo de profil supprimée avec succès',
        user: serialize(user),
      });
    } catch (error) {
      if (error.code === 'P2025') {
        console.log('❌ Utilisateur non trouvé:', uid);
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la photo:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
