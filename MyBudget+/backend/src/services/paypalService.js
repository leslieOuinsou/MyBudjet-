import axios from 'axios';

// Configuration PayPal
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Obtenir un access token PayPal
export const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erreur obtention token PayPal:', error.response?.data || error.message);
    throw new Error('Impossible de se connecter à PayPal');
  }
};

// Obtenir les informations du compte PayPal
export const getPayPalAccountInfo = async (accessToken) => {
  try {
    console.log('🔄 Récupération infos compte PayPal...');
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/identity/oauth2/userinfo?schema=openid`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Infos compte reçues:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur récupération infos compte:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    throw new Error('Impossible de récupérer les informations du compte');
  }
};

// Obtenir les informations PayPal complètes (solde + profil)
export const getPayPalBalance = async (accessToken) => {
  try {
    console.log('🔄 Récupération des infos PayPal complètes...');
    
    if (!accessToken) {
      console.log('⚠️ Pas de token utilisateur disponible');
      return { 
        value: '0.00', 
        currency_code: 'EUR',
        profile: null
      };
    }
    
    // Récupérer les informations de profil
    let profileInfo = {};
    try {
      const userInfoResponse = await axios.get(
        `${PAYPAL_API_BASE}/v1/oauth2/token/userinfo?schema=openid`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Infos profil PayPal reçues:', userInfoResponse.data);
      profileInfo = userInfoResponse.data;
    } catch (profileError) {
      console.log('⚠️ Erreur récupération profil:', profileError.message);
    }
    
    // Essayer de récupérer le solde (peut échouer)
    let balance = { value: '0.00', currency_code: 'EUR' };
    try {
      const response = await axios.get(
        `${PAYPAL_API_BASE}/v1/reporting/balances?currency_code=EUR`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Vrai solde PayPal reçu:', response.data);
      balance = response.data.balances?.[0]?.available_balance || { value: '0.00', currency_code: 'EUR' };
    } catch (balanceError) {
      console.log('⚠️ Solde non disponible (permissions requises)');
    }
    
    // Retourner solde + profil
    return {
      ...balance,
      profile: profileInfo
    };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
    return { 
      value: '0.00', 
      currency_code: 'EUR',
      profile: null
    };
  }
};

// Obtenir les transactions PayPal (vraies données avec permissions avancées)
export const getPayPalTransactions = async (accessToken, startDate, endDate) => {
  try {
    console.log('🔄 Récupération des transactions PayPal (avec permissions avancées)...');
    
    if (!accessToken) {
      console.log('⚠️ Pas de token utilisateur disponible');
      return [];
    }
    
    // Format des dates : YYYY-MM-DDTHH:MM:SS-HHMM ou YYYY-MM-DDTHH:MM:SSZ
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();
    
    console.log('  - Période: du', start, 'au', end);
    
    // Utiliser l'API Reporting avec les nouveaux scopes
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/reporting/transactions`,
      {
        params: {
          start_date: start,
          end_date: end,
          fields: 'all',
          page_size: 100,
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ Vraies transactions PayPal reçues:', response.data.transaction_details?.length || 0);
    
    // Retourner les vraies transactions
    return response.data.transaction_details || [];
    
  } catch (error) {
    console.error('❌ Erreur récupération transactions:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    
    // Si l'API Reporting échoue, essayer l'API Payments
    try {
      console.log('🔄 Tentative avec l\'API Payments/Captures...');
      const paymentsResponse = await axios.get(
        `${PAYPAL_API_BASE}/v2/payments/captures`,
        {
          params: {
            start_time: start,
            end_time: end,
            page_size: 100,
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Captures reçues:', paymentsResponse.data.captures?.length || 0);
      
      // Convertir les captures au format des transactions
      const transactions = (paymentsResponse.data.captures || []).map(capture => ({
        transaction_info: {
          transaction_id: capture.id,
          transaction_amount: capture.amount,
          transaction_status: capture.status === 'COMPLETED' ? 'S' : 'P',
          transaction_subject: capture.custom_id || 'Paiement PayPal',
          transaction_initiation_date: capture.create_time,
        },
        payer_info: {
          payer_name: {
            alternate_full_name: capture.payee?.merchant_id || 'Marchand PayPal'
          }
        },
      }));
      
      return transactions;
      
    } catch (paymentsError) {
      console.error('❌ API Payments aussi échouée:', paymentsError.response?.data || paymentsError.message);
      console.log('💡 Retour d\'un tableau vide');
      return [];
    }
  }
};

// Obtenir une URL d'autorisation OAuth PayPal
export const getPayPalAuthUrl = (redirectUri) => {
  // Scope minimal uniquement (pour éviter l'erreur "invalid scope")
  const scope = 'openid'; // Uniquement openid pour Sandbox
  
  const params = new URLSearchParams({
    client_id: PAYPAL_CLIENT_ID,
    response_type: 'code',
    scope: scope,
    redirect_uri: redirectUri,
  });
  
  console.log('🔗 Génération URL PayPal avec scope minimal:', scope);
  
  // Utiliser l'URL correcte pour l'autorisation PayPal
  const authBase = process.env.PAYPAL_MODE === 'live' 
    ? 'https://www.paypal.com' 
    : 'https://sandbox.paypal.com';
  
  return `${authBase}/signin/authorize?${params.toString()}`;
};

// Échanger le code d'autorisation contre un access token
export const exchangePayPalCode = async (code, redirectUri) => {
  try {
    console.log('🔄 Échange code PayPal...');
    console.log('  - Code:', code.substring(0, 20) + '...');
    console.log('  - Redirect URI:', redirectUri);
    console.log('  - API Base:', PAYPAL_API_BASE);
    console.log('  - Client ID:', PAYPAL_CLIENT_ID ? '✅ Présent' : '❌ Manquant');
    console.log('  - Client Secret:', PAYPAL_CLIENT_SECRET ? '✅ Présent' : '❌ Manquant');
    
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    console.log('  - Auth header:', auth.substring(0, 20) + '...');
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });
    
    console.log('  - Params:', params.toString());
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      params,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    console.log('✅ Token reçu de PayPal');
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('❌ Erreur échange code PayPal:');
    console.error('  - Status:', error.response?.status);
    console.error('  - Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('  - Message:', error.message);
    throw error;
  }
};

// Rafraîchir le token d'accès
export const refreshPayPalToken = async (refreshToken) => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    console.error('❌ Erreur rafraîchissement token:', error.response?.data || error.message);
    throw new Error('Impossible de rafraîchir le token');
  }
};

export default {
  getPayPalAccessToken,
  getPayPalAccountInfo,
  getPayPalBalance,
  getPayPalTransactions,
  getPayPalAuthUrl,
  exchangePayPalCode,
  refreshPayPalToken,
};

