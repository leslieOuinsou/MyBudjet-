import Category from '../models/category.js';

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
