const { Category } = require('../models');

class CategoryController {
  async index(req, res) {
    try {
      const { establishmentId } = req.query;
      const where = { active: true };
      
      if (req.user?.role === 'admin' && req.user.establishmentId) {
        where.establishmentId = req.user.establishmentId;
      } else if (establishmentId) {
        where.establishmentId = establishmentId;
      }

      const categories = await Category.findAll({
        where,
        order: [['order', 'ASC'], ['name', 'ASC']],
      });

      return res.json({ success: true, data: categories });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const category = await Category.create(req.body);
      return res.status(201).json({ success: true, data: category });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
      await category.update(req.body);
      return res.json({ success: true, data: category });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
      await category.update({ active: false });
      return res.json({ success: true, message: 'Categoria removida' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CategoryController();
