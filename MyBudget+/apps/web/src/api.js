const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

function getAuthHeaders(includeContentType = true) {
  // Vérifier d'abord localStorage, puis sessionStorage
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

// Fonction utilitaire pour gérer les réponses d'erreur
async function handleApiResponse(response) {
  if (response.status === 401) {
    // Token expiré ou invalide
    localStorage.removeItem('token');
    // Rediriger vers la page de connexion si on est dans le navigateur
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(errorData.message || `Erreur ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// AUTH API FUNCTIONS
// ============================================

// Connexion utilisateur
export async function login(email, password, rememberMe = false) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Identifiants invalides' }));
      
      console.error('❌ Erreur de connexion:', errorData);
      
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors.map(e => e.message || e.msg).join(', '));
      }
      throw new Error(errorData.message || 'Identifiants invalides');
    }
    
    const data = await response.json();
    
    // Stockage du token selon l'option "Se souvenir de moi"
    if (rememberMe) {
      // Stockage persistant (localStorage)
      localStorage.setItem('token', data.token);
      localStorage.setItem('rememberMe', 'true');
    } else {
      // Stockage temporaire (sessionStorage)
      sessionStorage.setItem('token', data.token);
      localStorage.removeItem('rememberMe');
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    throw error;
  }
}

// Mot de passe oublié
export async function forgotPassword(email, from = 'user') {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, from }), // Inclure le paramètre 'from'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    throw error;
  }
}

// Réinitialisation du mot de passe
export async function resetPassword(token, newPassword) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la réinitialisation du mot de passe');
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    throw error;
  }
}

// User API
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: { ...getAuthHeaders(false) },
  });
  return handleApiResponse(res);
}

// Notifications API
export async function getNotifications(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_URL}/notifications${queryString ? `?${queryString}` : ''}`;
  const res = await fetch(url, {
    headers: { ...getAuthHeaders(false) },
  });
  return handleApiResponse(res);
}

export async function markNotificationAsRead(id) {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(false) },
  });
  if (!res.ok) throw new Error("Erreur lors du marquage de la notification");
  return res.json();
}

export async function markAllNotificationsAsRead() {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: { ...getAuthHeaders(false) },
  });
  if (!res.ok) throw new Error("Erreur lors du marquage des notifications");
  return res.json();
}

export async function deleteNotification(id) {
  const res = await fetch(`${API_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders(false) },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de la notification");
  return res.json();
}

export async function getNotificationPreferences() {
  const res = await fetch(`${API_URL}/notifications/preferences`, {
    headers: { ...getAuthHeaders(false) },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des préférences");
  return res.json();
}

export async function updateNotificationPreferences(preferences) {
  const res = await fetch(`${API_URL}/notifications/preferences`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour des préférences");
  return res.json();
}

// Settings API
export async function getUserSettings() {
  const res = await fetch(`${API_URL}/settings/preferences`, {
    headers: { ...getAuthHeaders(false) },
  });
  return handleApiResponse(res);
}

export async function updateUserSettings(settings) {
  console.log('📤 Envoi des paramètres:', settings);
  const res = await fetch(`${API_URL}/settings/preferences`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Erreur inconnue' }));
    console.error('❌ Erreur API:', errorData);
    throw new Error(errorData.message || "Erreur lors de la mise à jour des paramètres");
  }
  const result = await res.json();
  console.log('✅ Réponse reçue:', result);
  return result;
}

// Upload photo de profil
export async function uploadProfilePicture(file) {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/settings/profile/picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Ne pas mettre Content-Type, le navigateur le fait automatiquement pour FormData
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'upload de la photo');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_URL}/settings/password`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error("Erreur lors du changement de mot de passe");
  return res.json();
}

export async function updateUserProfile(profileData) {
  const res = await fetch(`${API_URL}/settings/profile`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du profil");
  return res.json();
}

export async function deleteUserAccount(password, confirmation) {
  const res = await fetch(`${API_URL}/settings/account`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify({ password, confirmation }),
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du compte");
  return res.json();
}

export async function exportUserData() {
  const res = await fetch(`${API_URL}/settings/export`, {
    headers: { ...getAuthHeaders(false) },
  });
  if (!res.ok) throw new Error("Erreur lors de l'export des données");
  return res.json();
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/settings/profile/picture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
    },
    body: formData,
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Erreur lors de l'upload de l'avatar");
  }
  return res.json();
}

export async function deleteAvatar() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/settings/profile/picture`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Erreur lors de la suppression de l'avatar");
  }
  return res.json();
}

export async function getBudgets() {
  const res = await fetch(`${API_URL}/budgets`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des budgets");
  return res.json();
}

export async function addBudget(budget) {
  const res = await fetch(`${API_URL}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(budget),
  });
  if (!res.ok) throw new Error("Erreur lors de l'ajout du budget");
  return res.json();
}

export async function deleteBudget(id) {
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du budget");
  return res.json();
}

export async function updateBudget(id, data) {
  const res = await fetch(`${API_URL}/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la modification du budget");
  return res.json();
}

// Dashboard API
export async function getDashboardData() {
  const res = await fetch(`${API_URL}/dashboard`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement du dashboard");
  return res.json();
}

// Categories API
export async function getCategories() {
  const res = await fetch(`${API_URL}/categories`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
  return res.json();
}

export async function addCategory(category) {
  const res = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Erreur lors de l'ajout de la catégorie");
  return res.json();
}

export async function updateCategory(id, data) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la modification de la catégorie");
  return res.json();
}

export async function deleteCategory(id) {
  const res = await fetch(`${API_URL}/categories/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de la catégorie");
  return res.json();
}

export async function syncCategoriesFromTransactions() {
  const res = await fetch(`${API_URL}/categories/sync`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Erreur lors de la synchronisation des catégories" }));
    throw new Error(errorData.message || "Erreur lors de la synchronisation des catégories");
  }
  return res.json();
}

// Wallets API
export async function getWallets() {
  const res = await fetch(`${API_URL}/wallets`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors du chargement des portefeuilles");
  return res.json();
}

export async function addWallet(wallet) {
  const res = await fetch(`${API_URL}/wallets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(wallet),
  });
  if (!res.ok) throw new Error("Erreur lors de l'ajout du portefeuille");
  return res.json();
}

export async function updateWallet(id, data) {
  const res = await fetch(`${API_URL}/wallets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la modification du portefeuille");
  return res.json();
}

export async function deleteWallet(id) {
  const res = await fetch(`${API_URL}/wallets/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du portefeuille");
  return res.json();
}

export async function recalculateWalletBalance(id) {
  const res = await fetch(`${API_URL}/wallets/${id}/recalculate`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Erreur lors du recalcul du solde" }));
    throw new Error(errorData.message || "Erreur lors du recalcul du solde");
  }
  return res.json();
}

// Transactions API
export async function getTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(
    `${API_URL}/transactions${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...getAuthHeaders() },
    }
  );
  if (!res.ok) throw new Error("Erreur lors du chargement des transactions");
  return res.json();
}

export async function addTransaction(transaction) {
  const res = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(transaction),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Erreur lors de l'ajout de la transaction" }));
    throw new Error(errorData.message || "Erreur lors de l'ajout de la transaction");
  }
  return res.json();
}

export async function updateTransaction(id, data) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Erreur lors de la modification de la transaction" }));
    throw new Error(errorData.message || "Erreur lors de la modification de la transaction");
  }
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_URL}/transactions/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de la transaction");
  return res.json();
}

// =====================
// REPORTS API
// =====================

export async function getReportsData(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/reports?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des données de rapport");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getFinancialStats(period = "month") {
  try {
    const response = await fetch(
      `${API_URL}/reports/stats?period=${period}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des statistiques");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getCategoryAnalytics(startDate, endDate) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await fetch(
      `${API_URL}/reports/categories?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des analyses par catégorie");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getMonthlyTrends(months = 12) {
  try {
    const response = await fetch(
      `${API_URL}/reports/trends?months=${months}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Erreur lors de la récupération des tendances");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function getTopTransactions(limit = 10, type = "expense") {
  try {
    const response = await fetch(
      `${API_URL}/reports/top-transactions?limit=${limit}&type=${type}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des top transactions");
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Obtenir les données de tendances pour les graphiques
export async function getTrendsData(period = "month") {
  try {
    const response = await fetch(
      `${API_URL}/reports/trends?period=${period}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération des données de tendances");
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des tendances:", error);
    throw error;
  }
}

// Obtenir les données de comparaison budget
export async function getBudgetComparison(period = "month") {
  try {
    const response = await fetch(
      `${API_URL}/reports/budget-comparison?period=${period}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok)
      throw new Error("Erreur lors de la récupération de la comparaison budget");
    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération de la comparaison budget:", error);
    throw error;
  }
}

export async function exportReportData(format = "csv", params = {}) {
  try {
    const queryParams = new URLSearchParams({ ...params, format }).toString();
    const response = await fetch(
      `${API_URL}/reports/export?${queryParams}`,
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) throw new Error("Erreur lors de l'export des données");

    if (format === "csv") {
      return await response.text();
    } else {
      return await response.blob();
    }
  } catch (error) {
    throw error;
  }
}

// =====================
// DONNÉES PAR DÉFAUT
// =====================

export async function addMissingDefaultData() {
  try {
    const response = await fetch(`${API_URL}/auth/add-default-data`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'ajout des données par défaut");
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// =====================
// IMPORT/EXPORT API
// =====================

export async function importTransactions(file, format) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await fetch(`${API_URL}/importexport/import`, {
      method: 'POST',
      headers: getAuthHeaders(false), // false to not include Content-Type for FormData
      body: formData
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'import des transactions');
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function exportTransactionsCSV(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/importexport/export/csv?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'export CSV');
    return await response.text();
  } catch (error) {
    throw error;
  }
}

export async function exportTransactionsExcel(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/importexport/export/excel?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'export Excel');
    return await response.blob();
  } catch (error) {
    throw error;
  }
}

export async function exportTransactionsPDF(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/importexport/export/pdf?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'export PDF');
    return await response.blob();
  } catch (error) {
    throw error;
  }
}

export async function exportFinancialReport(params = {}) {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}/importexport/report?${queryParams}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'export du rapport financier');
    return await response.blob();
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// FORECASTS API FUNCTIONS
// ============================================================================

// Obtenir les prévisions de solde
export async function getProjectedBalance(months = 1) {
  const response = await fetch(`${API_URL}/forecasts/balance?months=${months}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération du solde projeté');
  }
  
  return response.json();
}

// Obtenir les données pour le graphique de prévisions
export async function getForecastChartData(months = 6) {
  const response = await fetch(`${API_URL}/forecasts/chart?months=${months}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des données de prévision');
  }
  
  return response.json();
}

// Obtenir les conseils personnalisés
export async function getPersonalizedAdvice() {
  const response = await fetch(`${API_URL}/forecasts/advice`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des conseils');
  }
  
  return response.json();
}

// Obtenir la vue d'ensemble des prévisions
export async function getForecastOverview() {
  const response = await fetch(`${API_URL}/forecasts/overview`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération de la vue d\'ensemble');
  }
  
  return response.json();
}

// Mettre à jour les paramètres de prévision
export async function updateForecastSettings(settings) {
  const response = await fetch(`${API_URL}/forecasts/settings`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour des paramètres');
  }
  
  return response.json();
}

// Helper pour télécharger un fichier blob
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Helper pour télécharger du texte comme fichier
export function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  downloadBlob(blob, filename);
}

// ============================================
// BILL REMINDERS API FUNCTIONS
// ============================================

// Obtenir tous les rappels de l'utilisateur
export async function getReminders() {
  try {
    const response = await fetch(`${API_URL}/billreminders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des rappels');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Créer un rappel
export async function createReminder(reminderData) {
  try {
    const response = await fetch(`${API_URL}/billreminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la création du rappel');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Modifier un rappel
export async function updateReminder(reminderId, reminderData) {
  try {
    const response = await fetch(`${API_URL}/billreminders/${reminderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reminderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la modification du rappel');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Supprimer un rappel
export async function deleteReminder(reminderId) {
  try {
    const response = await fetch(`${API_URL}/billreminders/${reminderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression du rappel');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// ============================================
// ADMIN API FUNCTIONS
// ============================================

// Obtenir les statistiques admin
export async function getAdminStats() {
  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Obtenir tous les utilisateurs (admin)
export async function getAllUsers() {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des utilisateurs');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Bloquer un utilisateur (admin)
export async function blockUser(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/block`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors du blocage de l\'utilisateur');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Débloquer un utilisateur (admin)
export async function unblockUser(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/unblock`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors du déblocage de l\'utilisateur');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Supprimer un utilisateur (admin)
export async function deleteUserAdmin(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Mettre à jour le rôle d'un utilisateur (admin)
export async function updateUserRole(userId, role) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du rôle');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Obtenir les statistiques d'un utilisateur (admin)
export async function getUserStatsAdmin(userId) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Obtenir tous les rappels de factures (admin)
export async function getAllBillRemindersAdmin() {
  try {
    const response = await fetch(`${API_URL}/admin/billreminders`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de la récupération des rappels');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Obtenir toutes les transactions récurrentes (admin)
export async function getAllRecurringTransactionsAdmin() {
  try {
    const response = await fetch(`${API_URL}/admin/recurring`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// ============================================
// BANK ACCOUNTS API FUNCTIONS
// ============================================

// Obtenir tous les comptes bancaires de l'utilisateur
export async function getBankAccounts() {
  try {
    const response = await fetch(`${API_URL}/bank-accounts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Obtenir un compte bancaire spécifique
export async function getBankAccountById(id) {
  try {
    const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Créer un nouveau compte bancaire
export async function createBankAccount(accountData) {
  try {
    const response = await fetch(`${API_URL}/bank-accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Mettre à jour un compte bancaire
export async function updateBankAccount(id, accountData) {
  try {
    const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Supprimer un compte bancaire
export async function deleteBankAccount(id) {
  try {
    const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Définir un compte comme principal
export async function setPrimaryBankAccount(id) {
  try {
    const response = await fetch(`${API_URL}/bank-accounts/${id}/set-primary`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Obtenir les statistiques des comptes bancaires
export async function getBankAccountsStats() {
  try {
    const response = await fetch(`${API_URL}/bank-accounts/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}


// ============================================
// PAYPAL API FUNCTIONS
// ============================================

// Obtenir l'URL d'autorisation PayPal
export async function getPayPalAuthUrl() {
  try {
    const response = await fetch(`${API_URL}/paypal/auth-url`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Callback après autorisation PayPal
export async function handlePayPalCallback(code) {
  try {
    const response = await fetch(`${API_URL}/paypal/process-callback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Vérifier le statut de connexion PayPal
export async function getPayPalStatus() {
  try {
    const response = await fetch(`${API_URL}/paypal/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Synchroniser les transactions PayPal
export async function syncPayPalTransactions() {
  try {
    const response = await fetch(`${API_URL}/paypal/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Déconnecter PayPal
export async function disconnectPayPal() {
  try {
    const response = await fetch(`${API_URL}/paypal/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Récupérer le solde PayPal
export async function getPayPalBalance() {
  try {
    const response = await fetch(`${API_URL}/paypal/balance`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}

// Récupérer les transactions PayPal
export async function getPayPalTransactions() {
  try {
    const response = await fetch(`${API_URL}/paypal/transactions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
}
