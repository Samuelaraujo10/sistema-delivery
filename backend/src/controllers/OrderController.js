const { Order, OrderItem, Product, Establishment, User } = require('../models');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { sequelize } = require('../database');

let clients = [];

function notifyClients(orderData) {
  const payload = JSON.stringify(orderData);
  clients.forEach(client => {
    const canSee = 
      (client.role === 'admin' && !client.establishmentId) ||
      (client.role === 'admin' && client.establishmentId === orderData.establishmentId) ||
      (client.role === 'customer' && client.id === orderData.userId);

    if (canSee) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error('Erro ao enviar evento SSE para o cliente:', err);
      }
    }
  });
}

class OrderController {
  async events(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = {
      id: req.user.id,
      role: req.user.role,
      establishmentId: req.user.establishmentId,
      res
    };
    clients.push(client);

    req.on('close', () => {
      clients = clients.filter(c => c.res !== res);
    });
  }

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
            include: [{ 
              model: Product, 
              as: 'product',
              include: ['category']
            }],
          },
          { model: Establishment, as: 'establishment' },
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
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
            include: [{ 
              model: Product, 
              as: 'product',
              include: ['category']
            }],
          },
          { model: Establishment, as: 'establishment' },
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
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
      const { establishmentId, items, paymentMethod, deliveryAddress, userAddress, notes, type, tableNumber, tabId } = req.body;

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Faca login para finalizar o pedido' });
      }

      if (req.user.role === 'admin' && type !== 'dine_in') {
        return res.status(403).json({ success: false, message: 'Administradores não podem realizar pedidos delivery.' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'O pedido precisa ter ao menos um item' });
      }

      let subtotal = 0;
      const orderItems = [];

      // Validate all products and fetch them
      const productMap = {};
      for (const item of items) {
        if (!item.productId) {
          return res.status(400).json({ success: false, message: 'productId e obrigatorio para todos os itens' });
        }
        const product = await Product.findByPk(item.productId);
        if (!product || !product.available) {
          return res.status(400).json({ success: false, message: `Produto ${item.productId} indisponivel` });
        }
        if (product.establishmentId !== establishmentId) {
          return res.status(400).json({ success: false, message: 'Todos os itens devem pertencer ao mesmo estabelecimento' });
        }
        productMap[item.productId] = product;
      }

      // Group items by comboId
      const groups = {};
      const standaloneItems = [];

      for (const item of items) {
        const quantity = Number(item.quantity || 1);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          return res.status(400).json({ success: false, message: 'Quantidade invalida' });
        }

        if (item.comboId) {
          if (!groups[item.comboId]) {
            groups[item.comboId] = {
              comboType: item.comboType,
              items: [],
            };
          }
          groups[item.comboId].items.push({ ...item, quantity });
        } else {
          standaloneItems.push({ ...item, quantity });
        }
      }

      // Process grouped custom builder items
      for (const comboId of Object.keys(groups)) {
        const group = groups[comboId];

        if (group.comboType === 'acai') {
          for (const item of group.items) {
            const product = productMap[item.productId];
            // Tamanho: normal price. Cremes, frutas, complementos e caldas: 0.00.
            const unitPrice = product.builderRole === 'tamanho' ? parseFloat(product.price) : 0;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice, notes: item.notes });
          }
        } else if (group.comboType === 'pizza') {
          // Find the flavor with the highest price
          let highestFlavorPrice = 0;
          let highestFlavorProductId = null;

          for (const item of group.items) {
            const product = productMap[item.productId];
            if (product.builderRole === 'sabor') {
              const price = parseFloat(product.price);
              if (price > highestFlavorPrice) {
                highestFlavorPrice = price;
                highestFlavorProductId = item.productId;
              }
            }
          }

          if (!highestFlavorProductId) {
            const firstFlavor = group.items.find(item => productMap[item.productId].builderRole === 'sabor');
            if (firstFlavor) {
              highestFlavorProductId = firstFlavor.productId;
            }
          }

          for (const item of group.items) {
            const product = productMap[item.productId];
            let unitPrice = 0;

            if (product.builderRole === 'tamanho') {
              unitPrice = parseFloat(product.price);
            } else if (product.builderRole === 'borda') {
              unitPrice = parseFloat(product.price);
            } else if (product.builderRole === 'sabor') {
              if (item.productId === highestFlavorProductId) {
                unitPrice = highestFlavorPrice;
              } else {
                unitPrice = 0;
              }
            }

            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice, notes: item.notes });
          }
        } else if (group.comboType === 'pasta') {
          const BUILDER_BASE_PRICE = 28.00;
          const FREE_TOPPINGS_LIMIT = 3;
          const EXTRA_TOPPING_PRICE = 4.00;

          // Process toppings
          let toppingIndex = 0;

          for (const item of group.items) {
            const product = productMap[item.productId];
            let unitPrice = 0;

            if (product.builderRole === 'massa') {
              unitPrice = BUILDER_BASE_PRICE;
            } else if (product.builderRole === 'molho' || product.builderRole === 'proteina') {
              unitPrice = 0;
            } else if (product.builderRole === 'topping') {
              if (toppingIndex < FREE_TOPPINGS_LIMIT) {
                unitPrice = 0;
              } else {
                unitPrice = EXTRA_TOPPING_PRICE;
              }
              toppingIndex++;
            }

            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice, notes: item.notes });
          }
        } else {
          // Fallback for unrecognized combo
          for (const item of group.items) {
            const product = productMap[item.productId];
            const unitPrice = parseFloat(product.price);
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice, notes: item.notes });
          }
        }
      }

      // Process standalone items
      for (const item of standaloneItems) {
        const product = productMap[item.productId];
        const unitPrice = parseFloat(product.price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        orderItems.push({ productId: item.productId, quantity: item.quantity, unitPrice, totalPrice, notes: item.notes });
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

      const orderId = await sequelize.transaction(async (t) => {
        const order = await Order.create({
          establishmentId,
          paymentMethod,
          deliveryAddress,
          notes,
          type: type || 'delivery',
          tableNumber: tableNumber || null,
          tabId: tabId || null,
          userId: req.user.id,
          subtotal,
          deliveryFee,
          total,
        }, { transaction: t });

        // Insert order items in bulk
        await OrderItem.bulkCreate(
          orderItems.map(item => ({ ...item, orderId: order.id })),
          { transaction: t }
        );

        return order.id;
      });

      // Update user address outside the transaction to avoid holding DB lock
      if (userAddress) {
        await User.update({ address: userAddress }, { where: { id: req.user.id } });
      }

      const fullOrder = await Order.findByPk(orderId, {
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Establishment, as: 'establishment' },
        ],
      });

      notifyClients(fullOrder);
      
      // Emitir via WebSockets
      if (req.io) {
        req.io.to(`establishment_${establishmentId}`).emit('new_order', fullOrder);
        req.io.emit('new_order_global', fullOrder); // Opção para todos
      }

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

      // Buscar o pedido completo para notificação
      const fullOrder = await Order.findByPk(order.id, {
        include: [
          { model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
          { model: Establishment, as: 'establishment' },
          { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }
        ]
      });

      // Notificar clientes via SSE
      notifyClients(fullOrder);

      // Emitir via WebSockets
      if (req.io) {
        req.io.to(`establishment_${fullOrder.establishmentId}`).emit('order_status_updated', fullOrder);
        req.io.emit('order_status_updated_global', fullOrder);
      }

      // Enviar mensagem WhatsApp via Twilio ao cliente
      try {
        const clientPhone = fullOrder.user?.phone;
        if (clientPhone) {
          const cleanPhone = clientPhone.replace(/\D/g, '');
          const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
          
          let statusMsg = '';
          switch (status) {
            case 'confirmed':
              statusMsg = `Olá, ${fullOrder.user.name}! Seu pedido #${fullOrder.orderNumber} foi confirmado pelo estabelecimento *${fullOrder.establishment.name}* e já está em em andamento!`;
              break;
            case 'preparing':
              statusMsg = `Olá, ${fullOrder.user.name}! Seu pedido #${fullOrder.orderNumber} está sendo preparado na cozinha!`;
              break;
            case 'delivering':
              statusMsg = `Olá, ${fullOrder.user.name}! Seu pedido #${fullOrder.orderNumber} saiu para entrega! 🛵 Logo chegará até você.`;
              break;
            case 'delivered':
              statusMsg = `Olá, ${fullOrder.user.name}! Seu pedido #${fullOrder.orderNumber} foi entregue. Bom apetite! 🎉`;
              break;
            case 'cancelled':
              statusMsg = `Olá, ${fullOrder.user.name}. Seu pedido #${fullOrder.orderNumber} foi cancelado pelo estabelecimento. Caso tenha dúvidas, entre em contato.`;
              break;
          }

          if (statusMsg) {
            await sendWhatsAppMessage(formattedPhone, statusMsg);
          }
        }
      } catch (waErr) {
        console.error('Falha ao enviar notificação WhatsApp para o cliente:', waErr.message);
      }

      return res.json({ success: true, data: fullOrder });
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


  // Notify client via WhatsApp with Pix key and request receipt
  async notifyPix(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [
          { model: Establishment, as: 'establishment' },
          { model: User, as: 'user', attributes: ['name', 'phone'] },
        ],
      });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
      }
      if (order.paymentMethod !== 'pix') {
        return res.status(400).json({ success: false, message: 'Método de pagamento não é pix' });
      }

      const formatPhone = (raw) => {
        if (!raw) return '';
        const digits = raw.replace(/\\D/g, '');
        return digits.startsWith('55') ? digits : `55${digits}`;
      };

      const establishmentPhone = formatPhone(order.establishment.whatsapp || order.establishment.phone);
      const clientPhone = formatPhone(order.user?.phone);
      const clientName = order.user?.name || 'Cliente';

      const message = `Olá! Sou o cliente *${clientName}* (WhatsApp: ${clientPhone}). ` +
        `Acabei de fazer o pedido *${order.orderNumber}* no valor de *R$ ${parseFloat(order.total).toFixed(2)}* ` +
        `com pagamento via Pix. A chave Pix do estabelecimento é *${order.establishment?.pixKey || ''}*. ` +
        `Por favor, me envie a confirmação de pagamento.`;

      await sendWhatsAppMessage(establishmentPhone, message);
      return res.json({ success: true, message: 'Mensagem enviada via WhatsApp' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
module.exports = new OrderController();
