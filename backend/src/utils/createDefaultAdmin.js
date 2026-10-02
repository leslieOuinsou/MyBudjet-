import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { initializeDefaultData } from './defaultData.js';
import { createWelcomeNotification } from './notificationGenerator.js';

/**
 * Crée un compte administrateur par défaut si aucun n'existe
 * Email: admin@mybudget.com
 * Mot de passe: AdminTest123!@#
 */
export async function createDefaultAdmin() {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('✅ Un compte admin existe déjà:', existingAdmin.email);
      return existingAdmin;
    }

    console.log('🔧 Aucun admin trouvé. Création du compte admin par défaut...');

    // Email et mot de passe par défaut
    const defaultEmail = 'admin@mybudget.com';
    const defaultPassword = 'AdminTest123!@#';
    const defaultName = 'Administrateur';

    // Vérifier si l'email existe déjà (avec un autre rôle)
    const existingUser = await prisma.user.findUnique({ where: { email: defaultEmail } });
    if (existingUser) {
      console.log('⚠️  L\'email admin existe déjà avec le rôle:', existingUser.role);
      
      // Promouvoir l'utilisateur en admin si nécessaire
      if (existingUser.role !== 'admin') {
        const promoted = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'admin' }
        });
        console.log('✅ Utilisateur promu en admin:', promoted.email);
        return promoted;
      }
      
      return existingUser;
    }

    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Créer le compte admin
    const admin = await prisma.user.create({
      data: {
        name: defaultName,
        email: defaultEmail,
        password: hashedPassword,
        role: 'admin'
      }
    });

    // Initialiser les données par défaut
    await initializeDefaultData(admin.id);
    await createWelcomeNotification(admin.id, admin.name);

    console.log('✅ Compte admin créé avec succès !');
    console.log('📧 Email:', defaultEmail);
    console.log('🔑 Mot de passe:', defaultPassword);
    console.log('');
    console.log('🎯 Connectez-vous sur /admin/login avec ces identifiants');
    console.log('');

    return admin;
  } catch (error) {
    console.error('❌ Erreur création admin par défaut:', error);
    return null;
  }
}

export default createDefaultAdmin;
