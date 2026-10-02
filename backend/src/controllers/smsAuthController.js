import prisma from '../lib/prisma.js';
import { serialize } from '../lib/serialize.js';
import { sendVerificationCode, generateVerificationCode, validatePhoneNumber } from '../utils/twilioService.js';
import jwt from 'jsonwebtoken';
import { createWelcomeNotification } from '../utils/notificationGenerator.js';
import { initializeDefaultData } from '../utils/defaultData.js';

// Envoyer un code de vérification SMS
export const sendSMSCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Le numéro de téléphone est requis' });
    }
    
    // Valider et formater le numéro
    console.log('📞 Numéro reçu du frontend:', phoneNumber);
    const formattedPhone = validatePhoneNumber(phoneNumber);
    console.log('📞 Numéro après validation:', formattedPhone);
    
    if (!formattedPhone) {
      return res.status(400).json({ 
        message: 'Format de numéro de téléphone invalide. Utilisez le format international (ex: +33612345678 ou +33766234575)' 
      });
    }
    
    // Vérifier s'il existe un code non expiré récent (limiter les envois)
    const recentCode = await prisma.sMSVerification.findFirst({
      where: {
        phoneNumber: formattedPhone,
        verified: false,
        expiresAt: { gt: new Date() },
        createdAt: { gt: new Date(Date.now() - 60000) } // Moins d'1 minute
      }
    });
    
    if (recentCode) {
      // En développement, retourner le code existant au lieu de bloquer
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📱 ============================================`);
        console.log(`📱 CODE SMS EXISTANT POUR ${formattedPhone}: ${recentCode.code}`);
        console.log(`📱 (Ce code est valide jusqu'à ${recentCode.expiresAt.toLocaleTimeString()})`);
        console.log(`📱 ============================================\n`);
        
        return res.status(200).json({
          success: true,
          message: 'Un code existe déjà. Utilisez le code affiché dans les logs du serveur.',
          code: recentCode.code, // Retourner le code en développement
          existing: true
        });
      }
      
      return res.status(429).json({ 
        message: 'Un code a déjà été envoyé. Veuillez patienter 1 minute avant de réessayer.' 
      });
    }
    
    // Générer un nouveau code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Supprimer les anciens codes non vérifiés pour ce numéro
    await prisma.sMSVerification.deleteMany({
      where: {
        phoneNumber: formattedPhone,
        verified: false
      }
    });
    
    // Créer un nouveau code de vérification
    const verification = await prisma.sMSVerification.create({
      data: {
        phoneNumber: formattedPhone,
        code,
        expiresAt
      }
    });
    
    // En développement, TOUJOURS logger le code pour faciliter les tests (même si l'envoi échoue)
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📱 ============================================`);
      console.log(`📱 CODE SMS POUR ${formattedPhone}: ${code}`);
      console.log(`📱 (Ce code est valide pendant 10 minutes)`);
      console.log(`📱 ============================================\n`);
    }
    
    // Envoyer le SMS via Twilio
    try {
      await sendVerificationCode(formattedPhone, code);
      
      res.status(200).json({
        success: true,
        message: 'Code de vérification envoyé par SMS',
        // En développement seulement
        ...(process.env.NODE_ENV === 'development' && { code })
      });
      
    } catch (smsError) {
      console.error('❌ Erreur envoi SMS:', smsError);
      console.error('❌ Détails de l\'erreur:', {
        message: smsError.message,
        code: smsError.code,
        status: smsError.status,
        moreInfo: smsError.moreInfo
      });
      
      // En développement, NE PAS supprimer le code si l'envoi échoue
      // Cela permet de tester l'authentification même si Twilio n'envoie pas le SMS
      if (process.env.NODE_ENV !== 'development') {
        await prisma.sMSVerification.delete({ where: { id: verification.id } });
      } else {
        console.log(`\n⚠️  MODE DÉVELOPPEMENT: Le code ${code} est conservé malgré l'erreur Twilio.`);
        console.log(`⚠️  Vous pouvez utiliser ce code pour tester l'authentification.\n`);

        // Le code étant conservé en base, le retourner pour permettre le test de bout en bout
        return res.status(200).json({
          success: true,
          message: "SMS non envoyé (Twilio non configuré ou erreur d'envoi). Code de test retourné en mode développement.",
          code,
          dev: true
        });
      }
      
      // Message d'erreur plus détaillé
      let errorMessage = 'Erreur lors de l\'envoi du SMS.';
      
      if (smsError.message.includes('not configured') || smsError.message.includes('manquantes')) {
        errorMessage = smsError.message;
      } else if (smsError.code === 21211) {
        errorMessage = 'Numéro de téléphone invalide. Vérifiez que le numéro est au format international (ex: +33612345678)';
      } else if (smsError.code === 21608) {
        errorMessage = 'Le numéro de destination n\'est pas vérifié. Pour un compte Trial, ajoutez votre numéro dans "Verified Caller IDs" sur Twilio. Note: La France ne permet pas la vérification par SMS - utilisez la vérification par appel téléphonique dans Twilio.';
      } else if (smsError.code === 20003) {
        errorMessage = 'Authentification Twilio échouée. Vérifiez votre TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.';
      } else if (smsError.message) {
        errorMessage = smsError.message;
      }
      
      return res.status(500).json({
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? {
          message: smsError.message,
          code: smsError.code,
          status: smsError.status
        } : undefined
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur sendSMSCode:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi du code de vérification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vérifier le code SMS et connecter/créer l'utilisateur
export const verifySMSCode = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        message: 'Le numéro de téléphone et le code sont requis' 
      });
    }
    
    // Valider et formater le numéro
    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({ 
        message: 'Format de numéro de téléphone invalide' 
      });
    }
    
    // Trouver le code de vérification
    const verification = await prisma.sMSVerification.findFirst({
      where: {
        phoneNumber: formattedPhone,
        code,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!verification) {
      // Incrémenter les tentatives si le code existe mais est incorrect
      const existingVerification = await prisma.sMSVerification.findFirst({
        where: {
          phoneNumber: formattedPhone,
          verified: false,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (existingVerification) {
        const updated = await prisma.sMSVerification.update({
          where: { id: existingVerification.id },
          data: { attempts: existingVerification.attempts + 1 }
        });
        
        if (updated.attempts >= 5) {
          await prisma.sMSVerification.deleteMany({
            where: {
              phoneNumber: formattedPhone,
              verified: false
            }
          });
          return res.status(429).json({ 
            message: 'Trop de tentatives échouées. Veuillez demander un nouveau code.' 
          });
        }
      }
      
      return res.status(400).json({ 
        message: 'Code invalide ou expiré. Veuillez demander un nouveau code.' 
      });
    }
    
    // Marquer le code comme vérifié
    await prisma.sMSVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    });
    
    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findFirst({ where: { phoneNumber: formattedPhone } });
    let isNewAccount = false;
    
    if (!user) {
      // Email obligatoire dans le schéma User : adresse technique unique par numéro (connexion SMS uniquement)
      const phoneDigits = formattedPhone.replace(/\D/g, '');
      const syntheticEmail = `sms.${phoneDigits}@phone.mybudget.internal`;

      // Créer un nouvel utilisateur avec le numéro de téléphone
      user = await prisma.user.create({
        data: {
          name: `Utilisateur ${formattedPhone.slice(-4)}`, // Nom par défaut avec les 4 derniers chiffres
          email: syntheticEmail,
          phoneNumber: formattedPhone,
          emailVerified: true, // Considéré comme vérifié via SMS
          role: 'user'
        }
      });
      isNewAccount = true;
      
      // Initialiser les données par défaut
      try {
        await initializeDefaultData(user.id);
      } catch (defaultDataError) {
        console.error('⚠️ Erreur initialisation données par défaut:', defaultDataError);
      }
      
      // Créer notification de bienvenue
      try {
        await createWelcomeNotification(user.id, user.name);
      } catch (notificationError) {
        console.error('⚠️ Erreur notification bienvenue:', notificationError);
      }
      
      console.log('✅ Nouvel utilisateur créé via SMS:', user.id);
    } else {
      // Vérifier si le compte est bloqué
      if (user.blocked) {
        return res.status(403).json({ 
          message: 'Compte bloqué. Contactez le support.' 
        });
      }
      
      // Mettre à jour le numéro de téléphone si nécessaire
      if (user.phoneNumber !== formattedPhone) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phoneNumber: formattedPhone }
        });
      }
    }
    
    // Mettre à jour la dernière connexion
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    // Générer un token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Supprimer le code de vérification utilisé
    await prisma.sMSVerification.delete({ where: { id: verification.id } });
    
    const serialized = serialize(user);
    
    res.status(200).json({
      success: true,
      message: isNewAccount || (user.createdAt && (new Date() - new Date(user.createdAt)) < 60000)
        ? 'Compte créé et connecté avec succès' 
        : 'Connexion réussie',
      token,
      user: {
        id: serialized.id,
        name: serialized.name,
        email: serialized.email,
        phoneNumber: serialized.phoneNumber,
        role: serialized.role
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur verifySMSCode:', error);
    res.status(500).json({
      message: 'Erreur lors de la vérification du code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
