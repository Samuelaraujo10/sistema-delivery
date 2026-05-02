const { Order, OrderItem, Product, Establishment } = require('../models');

class OrderController {
  async index(req, res) {
    try {
      const { userId, establishmentId, status } = req.query;
      const where = {};

      if (req.user.role === 'admin') {
        if (req.user.establishmentId) {
          where.establishmentId = req.user.establishmentId;
        } else if (establishmentId) {
          where.establishmentId = establishmentId;
        }
        if (userId) where.userId = userId;
      } else {
        where.userId = req.user.id;
      }

      if (status) where.status = status;

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }],
          },
          { model: Establishment, as: 'establishment' },
        ],
        order: [['createdAt', 'DESC']],
      });

      return res.json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async show(req, res) {
    try {
      const order = await Order.findByPk(req.params.id, {
        include: [
          {
            model: OrderItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }],
          },
          { model: Establishment, as: 'establishment' },
        ],
      });

      if (!order) return res.status(404).json({ success: false, message: 'Pedido nao encontrado' });

      if (req.user) {
        const canSeeAsCustomer = order.userId === req.user.id;
        const canSeeAsAdmin = req.user.role === 'admin' && (!req.user.establishmentId || order.establishmentId === req.user.establishmentId);
        if (!canSeeAsCustomer && !canSeeAsAdmin) {
          return res.status(403).json({ success: false, message: 'Acesso negado ao pedido' });
        }
      }

      return res.json({ success: true, data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const { establishmentId, items, paymentMethod, deliveryAddress, notes } = req.body;

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Faca login para finalizar o pedido' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'O pedido precisa ter ao menos um item' });
      }

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product || !product.available) {
          return res.status(400).json({ success: false, message: `Produto ${item.productId} indisponivel` });
        }
        if (product.establishmentId !== establishmentId) {
          return res.status(400).json({ success: false, message: 'Todos os itens devem pertencer ao mesmo estabelecimento' });
        }

        const quantity = Number(item.quantity || 1);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          return res.status(400).json({ success: false, message: 'Quantidade invalida' });
        }

        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * quantity;
        subtotal += totalPrice;
        orderItems.push({ productId: item.productId, quantity, unitPrice, totalPrice, notes: item.notes });
      }

      const establishment = await Establishment.findByPk(establishmentId);
      if (!establishment || !establishment.active) {
        return res.status(400).json({ success: false, message: 'Estabelecimento indisponivel' });
      }
      if (!establishment.isOpen) {
        return res.status(400).json({ success: false, message: 'Estabelecimento fechado no momento' });
      }

      const deliveryFee = parseFloat(establishment.deliveryFee || 0);
      const total = subtotal + deliveryFee;

      if (subtotal < parseFloat(establishment.minOrder || 0)) {
        return res.status(400).json({ success: false, message: `Pedido minimo de R$ ${parseFloat(establishment.minOrder).toFixed(2)}` });
      }

      const order = await Order.create({
        establishmentId,
        paymentMethod,
        deliveryAddress,
        notes,
        userId: req.user.id,
        subtotal,
        deliveryFee,
        total,
      });

      for (const item of orderItems) {
        await OrderItem.create({ ...item, orderId: order.id });
      }

      const fullOrder = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Establishment, as: 'establishment' },
        ],
      });

      return res.status(201).json({ success: true, data: fullOrder });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await Order.findByPk(id);
      if (!order) return res.status(404).json({ success: false, message: 'Pedido nao encontrado' });

      if (req.user.establishmentId && order.establishmentId !== req.user.establishmentId) {
        return res.status(403).json({ success: false, message: 'Acesso negado ao pedido' });
      }

      await order.update({ status });
      return res.json({ success: true, data: order });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async userOrders(req, res) {
    try {
      const userId = req.user.role === 'admin' ? req.params.userId : req.user.id;
      const orders = await Order.findAll({
        where: { userId },
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Establishment, as: 'establishment' },
        ],
        order: [['createdAt', 'DESC']],
      });
      return res.json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new OrderController();
