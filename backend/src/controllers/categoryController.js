import prisma from '../lib/prisma.js';
import { serialize, userId } from '../lib/serialize.js';

export const getCategories = async (req, res) => {
  const categories = serialize(
    await prisma.category.findMany({
      where: { userId: userId(req.user) },
    })
  );
  res.json(categories);
};

export const getCategory = async (req, res) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json(serialize(category));
};

export const createCategory = async (req, res) => {
  const { name, type, color, icon } = req.body;
  const category = await prisma.category.create({
    data: {
      name,
      type,
      color,
      icon,
      userId: userId(req.user),
    },
  });
  res.status(201).json(serialize(category));
};

export const updateCategory = async (req, res) => {
  const { name, type, color, icon } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, type, color, icon },
    });
    res.json(serialize(category));
  } catch {
    return res.status(404).json({ message: 'Category not found' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted' });
  } catch {
    return res.status(404).json({ message: 'Category not found' });
  }
};

// Synchroniser les catégories avec les transactions existantes
export const syncCategoriesFromTransactions = async (req, res) => {
  try {
    const uid = userId(req.user);

    const transactions = await prisma.transaction.findMany({
      where: { userId: uid },
      include: { category: true },
    });

    // Extraire les noms uniques (legacy string ou relation peuplée)
    const categoryNames = [
      ...new Set(
        transactions
          .map((t) => {
            if (typeof t.category === 'string') return t.category;
            if (t.category?.name) return t.category.name;
            return null;
          })
          .filter(Boolean)
      ),
    ];

    const existingCategories = await prisma.category.findMany({
      where: { userId: uid },
    });
    const existingNames = existingCategories.map((c) => c.name);

    let createdCount = 0;
    for (const name of categoryNames) {
      if (!existingNames.includes(name)) {
        await prisma.category.create({
          data: {
            name,
            type: 'expense',
            color: '#1E73BE',
            icon: '💳',
            userId: uid,
          },
        });
        createdCount++;
      }
    }

    console.log(`✅ Synchronisation des catégories: ${createdCount} nouvelle(s) catégorie(s) créée(s)`);

    res.json({
      message: 'Catégories synchronisées avec succès',
      createdCount,
      totalCategories: categoryNames.length,
    });
  } catch (error) {
    console.error('Erreur lors de la synchronisation des catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la synchronisation des catégories' });
  }
};
