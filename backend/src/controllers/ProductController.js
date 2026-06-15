const { Product, Category } = require('../models');

const applyEmojiTransformation = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('/upload/')) return url;
  if (url.includes('e_bgremoval') || url.includes('e_background_removal')) return url;
  return url.replace('/upload/', '/upload/e_bgremoval,c_fit,w_400,h_400,f_png/');
};

const normalizeProductPayload = (payload) => {
  const data = { ...payload };

  if (typeof data.modifierGroups === 'string') {
    try {
      data.modifierGroups = JSON.parse(data.modifierGroups || '[]');
    } catch (error) {
      data.modifierGroups = [];
    }
  }

  ['available', 'featured'].forEach((field) => {
    if (typeof data[field] === 'string') data[field] = data[field] === 'true';
  });

  ['price', 'originalPrice'].forEach((field) => {
    if (data[field] === '') data[field] = null;
  });

  return data;
};

class ProductController {
  async index(req, res) {
    try {
      const { establishmentId, categoryId, featured, builderRole, adminView } = req.query;
      const where = {};

      if (adminView !== 'true') {
        where.available = true;
      }

      // Se for admin, filtra pelo estabelecimento dele (se houver)
      if (req.user?.role === 'admin' && req.user.establishmentId) {
        where.establishmentId = req.user.establishmentId;
      } else if (establishmentId) {
        where.establishmentId = establishmentId;
      }

      if (categoryId) where.categoryId = categoryId;
      if (featured === 'true') where.featured = true;
      if (builderRole) where.builderRole = builderRole;

      const products = await Product.findAll({
        where,
        include: [{ model: Category, as: 'category' }],
        order: [['featured', 'DESC'], ['price', 'ASC'], ['name', 'ASC']],
      });

      return res.json({ success: true, data: products });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Retorna produtos agrupados por builderRole para montagem (Pasta, Açaí, etc.)
  async builderItems(req, res) {
    try {
      const { establishmentId } = req.params;
      const { adminView } = req.query;
      
      const where = { 
        establishmentId, 
        builderRole: { [require('sequelize').Op.ne]: 'none' }
      };

      // Se for admin, garante que está vendo o próprio estabelecimento
      if (req.user?.role === 'admin' && req.user.establishmentId && req.user.establishmentId !== establishmentId) {
        return res.status(403).json({ success: false, message: 'Acesso negado ao estabelecimento' });
      }

      if (adminView !== 'true') {
        where.available = true;
      }
 
      // Busca todos os produtos com builderRole != 'none'
      const products = await Product.findAll({
        where,
        include: [{ model: Category, as: 'category' }],
        order: [['featured', 'DESC'], ['price', 'ASC']],
      });
 
      // Agrupa por builderRole
      const result = products.reduce((acc, product) => {
        let role = product.builderRole;
        // Compatibilidade: se o role for topping mas o nome da categoria contiver "complemento", mapeia para complemento
        if (role === 'topping' && product.category?.name?.toLowerCase()?.includes('complemento')) {
          role = 'complemento';
        }
        if (!acc[role]) acc[role] = [];
        acc[role].push(product);
        return acc;
      }, {});
 
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async show(req, res) {
    try {
      const product = await Product.findByPk(req.params.id, {
        include: [{ model: Category, as: 'category' }],
      });

      if (!product) return res.status(404).json({ success: false, message: 'Produto não encontrado' });
      
      // Verificação de permissão para admin
      if (req.user?.role === 'admin' && req.user.establishmentId && product.establishmentId !== req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      return res.json({ success: true, data: product });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const data = normalizeProductPayload(req.body);
      if (req.file) {
        data.image = req.file.path; // Cloudinary returns the full URL in req.file.path
      }
      
      if (req.body.isEmojiIcon === 'true' && data.image) {
        data.image = applyEmojiTransformation(data.image);
      }

      // Força o establishmentId do admin
      if (req.user.role === 'admin' && req.user.establishmentId) {
        data.establishmentId = req.user.establishmentId;
      }

      const product = await Product.create(data);
      return res.status(201).json({ success: true, data: product });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produto não encontrado' });

      // Verificação de permissão para admin
      if (req.user.role === 'admin' && req.user.establishmentId && product.establishmentId !== req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      const data = normalizeProductPayload(req.body);
      if (req.file) {
        data.image = req.file.path;
      } else {
        data.image = product.image; // Garante que a imagem antiga seja considerada caso não mande nova
      }

      if (req.body.isEmojiIcon === 'true' && data.image) {
        data.image = applyEmojiTransformation(data.image);
      }

      await product.update(data);
      return res.json({ success: true, data: product });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async destroy(req, res) {
    try {
      const product = await Product.findByPk(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Produto não encontrado' });

      // Verificação de permissão para admin
      if (req.user.role === 'admin' && req.user.establishmentId && product.establishmentId !== req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Acesso negado' });
      }

      await product.destroy();
      return res.json({ success: true, message: 'Produto removido permanentemente' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
