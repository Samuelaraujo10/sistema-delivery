const { Establishment, Category, Product } = require('../models');
const { Op } = require('sequelize');

class EstablishmentController {
  async index(req, res) {
    try {
      const { type, search } = req.query;
      const where = { active: true };

      if (type && type !== 'all') where.type = type;
      if (search) where.name = { [Op.like]: `%${search}%` };

      const establishments = await Establishment.findAll({
        where,
        order: [['rating', 'DESC'], ['name', 'ASC']],
      });

      return res.json({ success: true, data: establishments });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async show(req, res) {
    try {
      const { slug } = req.params;
      const establishment = await Establishment.findOne({
        where: { slug, active: true },
        include: [
          {
            model: Category,
            as: 'categories',
            where: { active: true },
            required: false,
            order: [['order', 'ASC']],
            include: [
              {
                model: Product,
                as: 'products',
                where: { available: true },
                required: false,
              },
            ],
          },
        ],
      });

      if (!establishment) {
        return res.status(404).json({ success: false, message: 'Estabelecimento não encontrado' });
      }

      return res.json({ success: true, data: establishment });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      // Somente Super Admin (sem establishmentId) pode criar novas lojas
      if (req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Apenas Administradores Gerais podem criar novas lojas.' });
      }

      const { name, type, description, primaryColor, secondaryColor, deliveryFee, minOrder, deliveryTime, address, phone } = req.body;
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const existing = await Establishment.findOne({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const establishment = await Establishment.create({
        name, type, description, slug: finalSlug,
        primaryColor, secondaryColor, deliveryFee, minOrder, deliveryTime, address, phone,
      });

      return res.status(201).json({ success: true, data: establishment });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      // Segurança: Admin só pode atualizar sua própria loja (ou Super Admin qualquer uma)
      if (req.user.establishmentId && req.user.establishmentId !== id) {
        return res.status(403).json({ success: false, message: 'Você não tem permissão para editar esta loja.' });
      }

      const establishment = await Establishment.findByPk(id);

      if (!establishment) {
        return res.status(404).json({ success: false, message: 'Estabelecimento não encontrado' });
      }

      await establishment.update(req.body);
      return res.json({ success: true, data: establishment });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async toggleOpen(req, res) {
    try {
      const { id } = req.params;

      // Segurança: Admin só pode atualizar sua própria loja (ou Super Admin qualquer uma)
      if (req.user.establishmentId && req.user.establishmentId !== id) {
        return res.status(403).json({ success: false, message: 'Ação não permitida para esta loja.' });
      }

      const establishment = await Establishment.findByPk(id);
      if (!establishment) return res.status(404).json({ success: false, message: 'Não encontrado' });

      await establishment.update({ isOpen: !establishment.isOpen });
      return res.json({ success: true, data: establishment });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Somente Super Admin pode excluir lojas
      if (req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Apenas Administradores Gerais podem excluir lojas.' });
      }

      const establishment = await Establishment.findByPk(id);
      if (!establishment) return res.status(404).json({ success: false, message: 'Loja não encontrada.' });

      await establishment.update({ active: false });
      return res.json({ success: true, message: 'Loja desativada com sucesso.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new EstablishmentController();
