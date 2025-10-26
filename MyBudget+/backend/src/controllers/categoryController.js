import Category from '../models/category.js';
import Transaction from '../models/transaction.js';

export const getCategories = async (req, res) => {
  const categories = await Category.find({ user: req.user?._id });
  res.json(categories);
};

export const getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

export const createCategory = async (req, res) => {
  const { name, type, color, icon } = req.body;
  const category = new Category({ name, type, color, icon, user: req.user?._id });
  await category.save();
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const { name, type, color, icon } = req.body;
  const category = await Category.findByIdAndUpdate(req.params.id, { name, type, color, icon }, { new: true });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(category);
};

export const deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
};

// Synchroniser les catégories avec les transactions existantes
export const syncCategoriesFromTransactions = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    // Trouver toutes les transactions de l'utilisateur
    const transactions = await Transaction.find({ user: userId });
    
    // Extraire les catégories uniques des transactions
    const categoryNames = [...new Set(transactions
      .filter(t => t.category && typeof t.category === 'string')
      .map(t => t.category))];
    
    // Récupérer les catégories existantes
    const existingCategories = await Category.find({ user: userId });
    const existingNames = existingCategories.map(c => c.name);
    
    // Créer les catégories manquantes
    let createdCount = 0;
    for (const name of categoryNames) {
      if (!existingNames.includes(name)) {
        await Category.create({
          name: name,
          type: 'expense', // Par défaut
          color: '#1E73BE',
          icon: '💳',
          user: userId
        });
        createdCount++;
      }
    }
    
    console.log(`✅ Synchronisation des catégories: ${createdCount} nouvelle(s) catégorie(s) créée(s)`);
    
    res.json({
      message: 'Catégories synchronisées avec succès',
      createdCount,
      totalCategories: categoryNames.length
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation des catégories' });
  }
};
