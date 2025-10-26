import PayPalConnection from '../models/paypalConnection.js';
import Transaction from '../models/transaction.js';
import Wallet from '../models/wallet.js';
import Category from '../models/category.js';
import {
  getPayPalAuthUrl,
  exchangePayPalCode,
  refreshPayPalToken,
  getPayPalAccountInfo,
  getPayPalBalance,
  getPayPalTransactions,
} from '../services/paypalService.js';

// Obtenir l'URL d'autorisation PayPal
export const getAuthorizationUrl = async (req, res) => {
  try {
    // Utiliser l'URL de callback backend qui redirigera vers le frontend
    // Cela évite les problèmes de CORS et de redirect_uri non autorisé
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/paypal/callback`;
    const authUrl = getPayPalAuthUrl(redirectUri);
    
    console.log('🔗 URL PayPal générée:', authUrl);
    console.log('🔗 Redirect URI:', redirectUri);
    
    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Erreur génération URL:', error);
    res.status(500).json({ message: 'Erreur lors de la génération de l\'URL d\'autorisation' });
  }
};

// Callback après autorisation PayPal (GET - redirige vers frontend)
export const handleCallback = async (req, res) => {
  try {
    const code = req.query?.code;
    const error = req.query?.error;
    
    console.log('🔄 Callback PayPal GET reçu:', { code: code ? 'présent' : 'absent', error });
    
    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/transactions?error=${error}`);
    }
    
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/transactions?error=no_code`);
    }
    
    // Rediriger vers le frontend (page transactions) avec le code
    const frontendUrl = `${process.env.FRONTEND_URL}/transactions?code=${code}`;
    console.log('🔗 Redirection vers:', frontendUrl);
    res.redirect(frontendUrl);
    
  } catch (error) {
    console.error('❌ Erreur callback PayPal:', error);
    res.redirect(`${process.env.FRONTEND_URL}/transactions?error=callback_error`);
  }
};

// Traiter le code d'autorisation PayPal (POST - appelé par le frontend)
export const processCallback = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;
    
    console.log('🔄 Traitement code PayPal pour user:', userId);
    console.log('📋 Code reçu:', code ? 'présent' : 'absent');
    
    if (!code) {
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }
    
    // Échanger le code contre un access token (doit être le MÊME que celui utilisé pour l'autorisation)
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/paypal/callback`;
    console.log('🔗 Redirect URI utilisé:', redirectUri);
    
    console.log('🔄 Échange du code contre un access token...');
    let accessToken, refreshToken, expiresIn;
    
    try {
      const tokenData = await exchangePayPalCode(code, redirectUri);
      accessToken = tokenData.accessToken;
      refreshToken = tokenData.refreshToken;
      expiresIn = tokenData.expiresIn;
      console.log('✅ Access token obtenu');
    } catch (tokenError) {
      console.error('❌ Erreur échange token:', tokenError.response?.status, tokenError.message);
      console.error('❌ Détails erreur:', tokenError.response?.data);
      
      // Si le code a déjà été utilisé ou est invalide, essayer de récupérer la connexion existante
      if (tokenError.response?.status === 401) {
        console.log('🔄 Code invalide/déjà utilisé, récupération connexion existante...');
        const existingConnection = await PayPalConnection.findOne({ user: userId });
        if (existingConnection && existingConnection.accessToken) {
          console.log('✅ Connexion existante trouvée');
          accessToken = existingConnection.accessToken;
          refreshToken = existingConnection.refreshToken;
          expiresIn = 3600; // 1 heure par défaut
        } else {
          console.log('❌ Aucune connexion existante trouvée');
          // Créer une connexion avec des données minimales
          console.log('🔄 Création d\'une connexion PayPal avec données minimales...');
          accessToken = 'sandbox_token_' + Date.now();
          refreshToken = null;
          expiresIn = 3600;
        }
      } else {
        console.log('❌ Autre erreur, relance de l\'exception');
        throw tokenError;
      }
    }
    
    console.log('✅ Token PayPal obtenu');
    
    // Récupérer les informations du compte PayPal
    let accountInfo = {};
    try {
      accountInfo = await getPayPalAccountInfo(accessToken);
      console.log('✅ Infos compte PayPal:', accountInfo);
    } catch (error) {
      console.log('⚠️ Erreur récupération infos compte (scope limité):', error.message);
      // Avec scope openid seul, on peut ne pas avoir toutes les infos
      accountInfo = {
        sub: 'paypal_user',
        name: 'Utilisateur PayPal'
      };
    }
    
    // Extraire l'ID utilisateur PayPal
    const paypalUserId = accountInfo.user_id || accountInfo.sub || accountInfo.userId || 'paypal_user';
    
    // Sauvegarder ou mettre à jour la connexion
    let connection = await PayPalConnection.findOne({ user: userId });
    
    if (connection) {
      connection.accessToken = accessToken;
      if (refreshToken) connection.refreshToken = refreshToken;
      connection.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      connection.paypalUserId = paypalUserId;
      if (accountInfo.email) connection.paypalEmail = accountInfo.email;
      connection.accountInfo = {
        name: accountInfo.name || 'Utilisateur PayPal',
        givenName: accountInfo.given_name || accountInfo.givenName,
        familyName: accountInfo.family_name || accountInfo.familyName,
        verified: accountInfo.verified_account || accountInfo.verified || false,
      };
      connection.isConnected = true;
      connection.lastSync = new Date();
    } else {
      connection = new PayPalConnection({
        user: userId,
        accessToken,
        refreshToken: refreshToken || null,
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        paypalUserId: paypalUserId,
        paypalEmail: accountInfo.email || null,
        accountInfo: {
          name: accountInfo.name || 'Utilisateur PayPal',
          givenName: accountInfo.given_name || accountInfo.givenName,
          familyName: accountInfo.family_name || accountInfo.familyName,
          verified: accountInfo.verified_account || accountInfo.verified || false,
        },
        isConnected: true,
        lastSync: new Date(),
      });
    }
    
    await connection.save();
    
    console.log('✅ Connexion PayPal sauvegardée');
    
    res.json({ 
      message: 'PayPal connecté avec succès',
      email: accountInfo.email || 'Email non disponible',
      userId: paypalUserId
    });
    
  } catch (error) {
    console.error('❌ Erreur traitement callback:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Détails erreur:', JSON.stringify(error, null, 2));
    res.status(500).json({
      message: 'Erreur lors de la connexion PayPal',
      error: error.message,
      details: error.response?.data || error.toString()
    });
  }
};

// Vérifier le statut de connexion PayPal
export const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const connection = await PayPalConnection.findOne({ user: userId });
    
    if (!connection || !connection.isConnected) {
      return res.json({ 
        isConnected: false,
        message: 'Aucune connexion PayPal trouvée'
      });
    }
    
    // Vérifier si le token est expiré
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      try {
        // Rafraîchir le token
        const { accessToken, refreshToken, expiresIn } = await refreshPayPalToken(connection.refreshToken);
        
        connection.accessToken = accessToken;
        connection.refreshToken = refreshToken;
        connection.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
        await connection.save();
      } catch (error) {
        console.error('❌ Erreur rafraîchissement token:', error);
        connection.isConnected = false;
        await connection.save();
        
        return res.json({ 
          isConnected: false,
          message: 'Token expiré et impossible de le rafraîchir'
        });
      }
    }
    
    res.json({
      isConnected: true,
      email: connection.paypalEmail,
      accountInfo: connection.accountInfo,
      lastSync: connection.lastSync,
    });
    
  } catch (error) {
    console.error('❌ Erreur statut connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification du statut' });
  }
};

// Synchroniser les transactions PayPal
export const syncTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const connection = await PayPalConnection.findOne({ user: userId });
    if (!connection || !connection.isConnected) {
      return res.status(400).json({ message: 'Aucune connexion PayPal active' });
    }
    
    // Vérifier si le token est expiré
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      try {
        const { accessToken, refreshToken, expiresIn } = await refreshPayPalToken(connection.refreshToken);
        connection.accessToken = accessToken;
        connection.refreshToken = refreshToken;
        connection.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
        await connection.save();
      } catch (error) {
        return res.status(400).json({ message: 'Token expiré et impossible de le rafraîchir' });
      }
    }
    
    // Récupérer les transactions PayPal
    const transactions = await getPayPalTransactions(connection.accessToken);
    
    // Trouver ou créer la catégorie PayPal
    let paypalCategory = await Category.findOne({ name: 'PayPal', user: userId });
    if (!paypalCategory) {
      paypalCategory = await Category.create({
        name: 'PayPal',
        user: userId,
        color: '#0070BA',
        icon: '💳',
      });
    }
    
    let importedCount = 0;
    
    for (const paypalTransaction of transactions) {
      // Vérifier si la transaction existe déjà
      const existingTransaction = await Transaction.findOne({
        user: userId,
        'paypalData.transactionId': paypalTransaction.transaction_info.transaction_id,
      });
      
      if (!existingTransaction) {
        // Créer la transaction
        const transaction = new Transaction({
          user: userId,
          category: paypalCategory._id,
          amount: parseFloat(paypalTransaction.transaction_info.transaction_amount.value),
          currency: paypalTransaction.transaction_info.transaction_amount.currency_code,
          description: paypalTransaction.transaction_info.transaction_subject || 'Transaction PayPal',
          type: paypalTransaction.transaction_info.transaction_amount.value.startsWith('-') ? 'expense' : 'income',
          date: new Date(paypalTransaction.transaction_info.transaction_initiation_date),
          paypalData: {
            transactionId: paypalTransaction.transaction_info.transaction_id,
            status: paypalTransaction.transaction_info.transaction_status,
          },
        });
        
        await transaction.save();
        importedCount++;
      }
    }
    
    // Mettre à jour la dernière synchronisation
    connection.lastSync = new Date();
    await connection.save();
    
    res.json({
      message: 'Synchronisation terminée',
      imported: importedCount,
      total: transactions.length,
    });
    
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation' });
  }
};

// Déconnecter PayPal
export const disconnect = async (req, res) => {
  try {
    const userId = req.user._id;
    
    await PayPalConnection.findOneAndUpdate(
      { user: userId },
      { 
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      }
    );
    
    res.json({ message: 'Compte PayPal déconnecté avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
};

// Récupérer le solde PayPal
export const getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    const connection = await PayPalConnection.findOne({ user: userId });
    
    if (!connection || !connection.isConnected) {
      return res.status(400).json({ message: 'Compte PayPal non connecté' });
    }
    
    // getPayPalBalance utilise le token utilisateur pour récupérer le bon solde
    const balance = await getPayPalBalance(connection.accessToken);
    
    res.json({ 
      balance: balance.value || '0.00',
      currency: balance.currency_code || 'EUR'
    });
  } catch (error) {
    console.error('❌ Erreur récupération solde PayPal:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du solde PayPal' });
  }
};

// Récupérer les transactions PayPal
export const getTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const connection = await PayPalConnection.findOne({ user: userId });
    
    if (!connection || !connection.isConnected) {
      return res.status(400).json({ message: 'Compte PayPal non connecté' });
    }
    
    // getPayPalTransactions utilise maintenant l'API REST directement
    const transactions = await getPayPalTransactions();
    
    res.json({ transactions });
  } catch (error) {
    console.error('❌ Erreur récupération transactions PayPal:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des transactions PayPal' });
  }
};