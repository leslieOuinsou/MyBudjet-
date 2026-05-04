import twilio from 'twilio';

// Initialiser le client Twilio
let twilioClient = null;

export function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials not configured');
      return null;
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

export async function sendVerificationCode(phoneNumber, code) {
  // Déclarer les variables en dehors du try pour qu'elles soient accessibles dans le catch
  let formattedPhone = '';
  let fromNumber = '';
  
  try {
    // Vérifier les variables d'environnement avant de continuer
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    console.log('🔍 Vérification configuration Twilio:');
    console.log('  - TWILIO_ACCOUNT_SID:', accountSid ? '✅ Configurée' : '❌ Manquante');
    console.log('  - TWILIO_AUTH_TOKEN:', authToken ? '✅ Configurée' : '❌ Manquante');
    console.log('  - TWILIO_PHONE_NUMBER:', fromNumber ? `✅ ${fromNumber}` : '❌ Manquante');
    
    if (!accountSid || !authToken) {
      const missing = [];
      if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
      throw new Error(`Variables Twilio manquantes: ${missing.join(', ')}. Configurez-les dans votre fichier .env`);
    }
    
    const client = getTwilioClient();
    
    if (!client) {
      throw new Error('Impossible d\'initialiser le client Twilio');
    }
    
    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER n\'est pas configurée dans votre fichier .env');
    }
    
    // Formater le numéro de téléphone (supprimer les espaces et ajouter + si nécessaire)
    formattedPhone = phoneNumber.replace(/\s+/g, '').trim(); // Supprimer tous les espaces
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }
    
    console.log('📤 Tentative d\'envoi SMS:');
    console.log('  - De (TWILIO_PHONE_NUMBER):', fromNumber);
    console.log('  - Vers (numéro utilisateur):', formattedPhone);
    console.log('  - Code:', code);
    
    const message = await client.messages.create({
      body: `Votre code de vérification MyBudget est : ${code}. Ce code expire dans 10 minutes.`,
      from: fromNumber,
      to: formattedPhone
    });
    
    console.log('✅ SMS envoyé avec succès!');
    console.log('  - Message SID:', message.sid);
    console.log('  - Status:', message.status);
    return { success: true, messageSid: message.sid };
    
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error);
    console.error('❌ Détails de l\'erreur Twilio:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo,
      stack: error.stack
    });
    
    // Messages d'erreur plus spécifiques selon le code d'erreur Twilio
    const targetNumber = formattedPhone || phoneNumber;
    
    if (error.code === 21211) {
      throw new Error(`Numéro de téléphone invalide: ${targetNumber}. Utilisez le format international (ex: +33612345678)`);
    } else if (error.code === 21608) {
      throw new Error(`Le numéro ${targetNumber} n'est pas vérifié. Pour un compte Trial, ajoutez ce numéro EXACT (format: ${targetNumber}) dans "Verified Caller IDs" sur Twilio. Vérifiez que le numéro dans Twilio correspond exactement (même format, sans espaces).`);
    } else if (error.code === 20003) {
      throw new Error('Authentification Twilio échouée. Vérifiez votre TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN dans le fichier .env');
    } else if (error.code === 21214) {
      throw new Error(`Le numéro ${fromNumber || 'TWILIO_PHONE_NUMBER'} n'est pas un numéro Twilio valide. Vérifiez TWILIO_PHONE_NUMBER dans votre .env`);
    } else if (error.message) {
      throw new Error(`Erreur Twilio: ${error.message} (Code: ${error.code || 'N/A'})`);
    }
    
    throw error;
  }
}

// Générer un code de vérification à 6 chiffres
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Valider le format du numéro de téléphone
export function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber) return false;
  
  // Supprimer les espaces et caractères spéciaux (garder seulement les chiffres et +)
  const cleaned = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Vérifier que c'est un numéro valide (au moins 10 chiffres)
  const digitsOnly = cleaned.replace(/\+/g, '');
  
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    console.log('❌ Numéro invalide - longueur:', digitsOnly.length, 'Numéro:', phoneNumber);
    return false;
  }
  
  // S'assurer qu'il y a un + au début
  const finalNumber = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  
  console.log('✅ Numéro validé:', phoneNumber, '→', finalNumber);
  return finalNumber;
}
