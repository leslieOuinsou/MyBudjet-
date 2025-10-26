import BankAccount from '../models/bankAccount.js';

// Obtenir tous les comptes bancaires de l'utilisateur connecté
export const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const accounts = await BankAccount.find({ user: userId, isActive: true })
      .sort({ isPrimary: -1, createdAt: -1 });
    
    // Ajouter les numéros masqués
    const accountsWithMasked = accounts.map(account => ({
      ...account.toObject(),
      maskedAccountNumber: account.getMaskedAccountNumber(),
    }));
    
    res.json(accountsWithMasked);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des comptes bancaires:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des comptes' });
  }
};

// Obtenir un compte bancaire spécifique
export const getBankAccountById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const account = await BankAccount.findOne({ _id: id, user: userId });
    
    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }
    
    res.json({
      ...account.toObject(),
      maskedAccountNumber: account.getMaskedAccountNumber(),
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau compte bancaire
export const createBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bankName,
      accountType,
      accountNumber,
      currency,
      balance,
      description,
      color,
      icon,
      isPrimary,
    } = req.body;
    
    // Validation
    if (!bankName || !accountNumber) {
      return res.status(400).json({ message: 'Nom de la banque et numéro de compte requis' });
    }
    
    // Vérifier si c'est le premier compte (le définir comme principal automatiquement)
    const existingAccounts = await BankAccount.countDocuments({ user: userId, isActive: true });
    const isFirstAccount = existingAccounts === 0;
    
    // Masquer le numéro de compte (garder seulement les 4 derniers chiffres)
    const lastFourDigits = accountNumber.slice(-4);
    
    const newAccount = new BankAccount({
      user: userId,
      bankName,
      accountType: accountType || 'checking',
      accountNumber: lastFourDigits, // Stocker seulement les 4 derniers chiffres
      currency: currency || 'EUR',
      balance: balance || 0,
      description,
      color: color || '#1E73BE',
      icon: icon || '🏦',
      isPrimary: isFirstAccount ? true : (isPrimary || false),
    });
    
    await newAccount.save();
    
    console.log(`✅ Compte bancaire créé: ${bankName} - ${lastFourDigits}`);
    
    res.status(201).json({
      message: 'Compte bancaire créé avec succès',
      account: {
        ...newAccount.toObject(),
        maskedAccountNumber: newAccount.getMaskedAccountNumber(),
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte bancaire:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du compte' });
  }
};

// Mettre à jour un compte bancaire
export const updateBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updates = req.body;
    
    // Ne pas permettre de modifier le numéro de compte complet
    delete updates.accountNumberFull;
    delete updates.user;
    
    const account = await BankAccount.findOne({ _id: id, user: userId });
    
    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }
    
    // Mettre à jour les champs autorisés
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        account[key] = updates[key];
      }
    });
    
    await account.save();
    
    console.log(`✅ Compte bancaire mis à jour: ${account.bankName}`);
    
    res.json({
      message: 'Compte bancaire mis à jour avec succès',
      account: {
        ...account.toObject(),
        maskedAccountNumber: account.getMaskedAccountNumber(),
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du compte:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
};

// Supprimer un compte bancaire (soft delete)
export const deleteBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const account = await BankAccount.findOne({ _id: id, user: userId });
    
    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }
    
    // Soft delete
    account.isActive = false;
    await account.save();
    
    // Si c'était le compte principal, définir un autre compte comme principal
    if (account.isPrimary) {
      const nextAccount = await BankAccount.findOne({ 
        user: userId, 
        isActive: true,
        _id: { $ne: id }
      });
      
      if (nextAccount) {
        nextAccount.isPrimary = true;
        await nextAccount.save();
      }
    }
    
    console.log(`✅ Compte bancaire supprimé: ${account.bankName}`);
    
    res.json({ message: 'Compte bancaire supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression' });
  }
};

// Définir un compte comme principal
export const setPrimaryAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    
    const account = await BankAccount.findOne({ _id: id, user: userId, isActive: true });
    
    if (!account) {
      return res.status(404).json({ message: 'Compte bancaire introuvable' });
    }
    
    account.isPrimary = true;
    await account.save(); // Le hook pre-save gérera le retrait des autres comptes principaux
    
    console.log(`✅ Compte principal défini: ${account.bankName}`);
    
    res.json({ 
      message: 'Compte défini comme principal',
      account: {
        ...account.toObject(),
        maskedAccountNumber: account.getMaskedAccountNumber(),
      },
    });
  } catch (error) {
    console.error('❌ Erreur lors de la définition du compte principal:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques des comptes bancaires
export const getBankAccountsStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const accounts = await BankAccount.find({ user: userId, isActive: true });
    
    const stats = {
      totalAccounts: accounts.length,
      totalBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
      byType: {},
      byCurrency: {},
    };
    
    // Statistiques par type de compte
    accounts.forEach(account => {
      stats.byType[account.accountType] = (stats.byType[account.accountType] || 0) + 1;
      stats.byCurrency[account.currency] = (stats.byCurrency[account.currency] || 0) + (account.balance || 0);
    });
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

export default {
  getBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryAccount,
  getBankAccountsStats,
};

