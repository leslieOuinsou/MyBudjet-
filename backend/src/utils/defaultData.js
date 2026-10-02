import prisma from '../lib/prisma.js';

// Catégories par défaut pour les dépenses
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentation', type: 'expense', color: '#FF6B6B', icon: 'MdRestaurant' },
  { name: 'Transport', type: 'expense', color: '#4ECDC4', icon: 'MdDirectionsCar' },
  { name: 'Logement', type: 'expense', color: '#45B7D1', icon: 'MdHome' },
  { name: 'Divertissement', type: 'expense', color: '#96CEB4', icon: 'MdTheaters' },
  { name: 'Santé', type: 'expense', color: '#FFEAA7', icon: 'MdLocalHospital' },
  { name: 'Éducation', type: 'expense', color: '#DDA0DD', icon: 'MdSchool' },
  { name: 'Shopping', type: 'expense', color: '#F7DC6F', icon: 'MdShoppingCart' },
  { name: 'Factures', type: 'expense', color: '#BB8FCE', icon: 'MdReceipt' },
  { name: 'Vêtements', type: 'expense', color: '#F8C471', icon: 'MdCheckroom' },
  { name: 'Voyage', type: 'expense', color: '#82E0AA', icon: 'MdFlight' },
  { name: 'Sport', type: 'expense', color: '#85C1E9', icon: 'MdFitnessCenter' },
  { name: 'Autres', type: 'expense', color: '#D7BDE2', icon: 'MdMoreHoriz' }
];

// Catégories par défaut pour les revenus
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salaire', type: 'income', color: '#58D68D', icon: 'MdWork' },
  { name: 'Freelance', type: 'income', color: '#F7DC6F', icon: 'MdLaptop' },
  { name: 'Investissements', type: 'income', color: '#85C1E9', icon: 'MdTrendingUp' },
  { name: 'Remboursement', type: 'income', color: '#BB8FCE', icon: 'MdAccountBalance' },
  { name: 'Cadeau', type: 'income', color: '#F8C471', icon: 'MdCardGiftcard' },
  { name: 'Autres revenus', type: 'income', color: '#D7BDE2', icon: 'MdAttachMoney' }
];

// Portefeuilles par défaut
const DEFAULT_WALLETS = [
  { name: 'Compte Courant', balance: 0 },
  { name: 'Épargne', balance: 0 },
  { name: 'Liquidités', balance: 0 },
  { name: 'Investissements', balance: 0 },
  { name: 'Carte de crédit', balance: 0 }
];

const DEFAULT_GOALS = [
  { name: "Fonds d'urgence", targetAmount: 10000, currentAmount: 0, color: '#FDE6E6' },
  { name: 'Épargne voyage', targetAmount: 5000, currentAmount: 0, color: '#FDF6E6' },
  { name: 'Investissements', targetAmount: 20000, currentAmount: 0, color: '#E6F6FD' },
];

// Fonction pour initialiser les données par défaut pour un utilisateur
export const initializeDefaultData = async (userId) => {
  try {
    console.log(`🔄 Initialisation des données par défaut pour l'utilisateur ${userId}`);
    
    // Vérifier si l'utilisateur a déjà des catégories
    const existingCategories = await prisma.category.findMany({ where: { userId } });
    const existingWallets = await prisma.wallet.findMany({ where: { userId } });
    const existingGoals = await prisma.financialGoal.findMany({ where: { userId } });
    
    let categoriesCreated = 0;
    let walletsCreated = 0;
    let goalsCreated = 0;
    
    // Créer les catégories par défaut si elles n'existent pas
    if (existingCategories.length === 0) {
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      
      await prisma.category.createMany({
        data: allCategories.map(catData => ({
          ...catData,
          userId
        }))
      });
      categoriesCreated = allCategories.length;
      console.log(`✅ ${categoriesCreated} catégories créées`);
    } else {
      console.log(`ℹ️ L'utilisateur a déjà ${existingCategories.length} catégories`);
    }
    
    // Créer les portefeuilles par défaut si ils n'existent pas
    if (existingWallets.length === 0) {
      await prisma.wallet.createMany({
        data: DEFAULT_WALLETS.map(walletData => ({
          ...walletData,
          userId
        }))
      });
      walletsCreated = DEFAULT_WALLETS.length;
      console.log(`✅ ${walletsCreated} portefeuilles créés`);
    } else {
      console.log(`ℹ️ L'utilisateur a déjà ${existingWallets.length} portefeuilles`);
    }

    if (existingGoals.length === 0) {
      await prisma.financialGoal.createMany({
        data: DEFAULT_GOALS.map((goal) => ({ ...goal, userId })),
      });
      goalsCreated = DEFAULT_GOALS.length;
      console.log(`✅ ${goalsCreated} objectifs créés`);
    } else {
      console.log(`ℹ️ L'utilisateur a déjà ${existingGoals.length} objectifs`);
    }
    
    return {
      success: true,
      categoriesCreated,
      walletsCreated,
      goalsCreated,
      message: `Données initialisées: ${categoriesCreated} catégories, ${walletsCreated} portefeuilles, ${goalsCreated} objectifs`
    };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des données par défaut:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Fonction pour ajouter des catégories manquantes à un utilisateur existant
export const addMissingCategories = async (userId) => {
  try {
    const existingCategories = await prisma.category.findMany({ where: { userId } });
    const existingCategoryNames = existingCategories.map(cat => cat.name);
    
    let added = 0;
    
    // Vérifier les catégories de dépenses manquantes
    for (const catData of DEFAULT_EXPENSE_CATEGORIES) {
      if (!existingCategoryNames.includes(catData.name)) {
        await prisma.category.create({
          data: {
            ...catData,
            userId
          }
        });
        added++;
      }
    }
    
    // Vérifier les catégories de revenus manquantes
    for (const catData of DEFAULT_INCOME_CATEGORIES) {
      if (!existingCategoryNames.includes(catData.name)) {
        await prisma.category.create({
          data: {
            ...catData,
            userId
          }
        });
        added++;
      }
    }
    
    return { success: true, added, message: `${added} catégories ajoutées` };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des catégories manquantes:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour ajouter des portefeuilles manquants à un utilisateur existant
export const addMissingWallets = async (userId) => {
  try {
    const existingWallets = await prisma.wallet.findMany({ where: { userId } });
    const existingWalletNames = existingWallets.map(wallet => wallet.name);
    
    let added = 0;
    
    for (const walletData of DEFAULT_WALLETS) {
      if (!existingWalletNames.includes(walletData.name)) {
        await prisma.wallet.create({
          data: {
            ...walletData,
            userId
          }
        });
        added++;
      }
    }
    
    return { success: true, added, message: `${added} portefeuilles ajoutés` };
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des portefeuilles manquants:', error);
    return { success: false, error: error.message };
  }
};
