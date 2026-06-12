const { Establishment, Category, Product, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database');

const normalizeEstablishmentPayload = (payload) => {
  const data = { ...payload };

  if ('deliveryFee' in data) {
    if (data.deliveryFee === '' || data.deliveryFee === null || data.deliveryFee === undefined) {
      data.deliveryFee = 0;
    } else {
      const val = parseFloat(data.deliveryFee);
      data.deliveryFee = isNaN(val) ? 0 : val;
    }
  }

  if ('minOrder' in data) {
    if (data.minOrder === '' || data.minOrder === null || data.minOrder === undefined) {
      data.minOrder = 0;
    } else {
      const val = parseFloat(data.minOrder);
      data.minOrder = isNaN(val) ? 0 : val;
    }
  }

  if ('deliveryTime' in data) {
    if (data.deliveryTime === '' || data.deliveryTime === null || data.deliveryTime === undefined) {
      data.deliveryTime = 40;
    } else {
      const val = parseInt(data.deliveryTime, 10);
      data.deliveryTime = isNaN(val) ? 40 : val;
    }
  }

  if ('hasBuilder' in data) {
    if (typeof data.hasBuilder === 'string') {
      data.hasBuilder = data.hasBuilder === 'true';
    }
  }

  // Remove campos vazios que não devem ser sobrescritos por strings vazias se não enviados
  if (data.logo === '') delete data.logo;

  return data;
};

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
      const { adminView } = req.query;

      const productWhere = {};
      if (adminView !== 'true') {
        productWhere.available = true;
      }

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
                where: productWhere,
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

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'O nome da loja é obrigatório.' });
      }

      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const existing = await Establishment.findOne({ where: { slug } });
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const data = normalizeEstablishmentPayload({
        ...req.body,
        slug: finalSlug
      });

      if (req.file) {
        data.logo = req.file.path;
      }

      const establishment = await sequelize.transaction(async (t) => {
        const est = await Establishment.create(data, { transaction: t });

        // If email and password are provided, create an admin user for this establishment
        if (req.body.email && req.body.password) {
          const userPayload = {
            name: req.body.name || 'Admin',
            email: req.body.email,
            password: req.body.password,
            role: 'admin',
            establishmentId: est.id,
            phone: req.body.phone || ''
          };
          await User.create(userPayload, { transaction: t });
        }
        return est;
      });

      return res.status(201).json({ success: true, data: establishment });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path;
        if (field === 'email') {
          return res.status(400).json({ success: false, message: 'O e-mail de login fornecido já está em uso por outro usuário.' });
        }
      }
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

      const data = normalizeEstablishmentPayload(req.body);
      
      if (req.file) {
        data.logo = req.file.path;
      }

      await establishment.update(data);
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
