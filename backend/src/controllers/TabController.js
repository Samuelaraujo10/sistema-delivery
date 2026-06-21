const { Tab, Order, OrderItem, Product, Establishment, User } = require('../models');

class TabController {
  async openTab(req, res) {
    try {
      const { establishmentId, tabNumber } = req.body;
      
      // Check if there is already an open tab for this table
      let tab = await Tab.findOne({
        where: { establishmentId, tabNumber, status: 'open' }
      });

      if (!tab) {
        tab = await Tab.create({
          establishmentId,
          tabNumber,
          status: 'open'
        });
      }

      return res.status(201).json({ success: true, data: tab });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getOpenTabs(req, res) {
    try {
      const { establishmentId } = req.params;
      const tabs = await Tab.findAll({
        where: { establishmentId, status: 'open' },
        include: [
          {
            model: Order,
            as: 'orders',
            include: [
              {
                model: OrderItem,
                as: 'items',
                include: [{ model: Product, as: 'product' }]
              }
            ]
          }
        ],
        order: [['openedAt', 'DESC']]
      });

      return res.json({ success: true, data: tabs });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async closeTab(req, res) {
    try {
      const { id } = req.params;
      const { splitWay, splitValue } = req.body; // Logic for split bill if needed

      const tab = await Tab.findByPk(id, {
        include: [
          {
            model: Order,
            as: 'orders',
            include: [
              {
                model: OrderItem,
                as: 'items',
                include: [{ model: Product, as: 'product' }]
              }
            ]
          }
        ]
      });

      if (!tab) return res.status(404).json({ success: false, message: 'Comanda não encontrada' });
      if (tab.status === 'closed') return res.status(400).json({ success: false, message: 'Comanda já está fechada' });

      // Calculate totals based on orders
      let total = 0;
      let subtotal = 0;
      
      for (const order of tab.orders) {
        if (order.status !== 'cancelled') {
          subtotal += parseFloat(order.subtotal);
          total += parseFloat(order.total);
        }
      }

      tab.subtotal = subtotal;
      tab.total = total;
      tab.status = 'closed';
      tab.closedAt = new Date();
      await tab.save();

      // Return tab with calculated split if requested
      let splitResult = null;
      if (splitWay === 'people' && splitValue > 0) {
        splitResult = {
          people: splitValue,
          valuePerPerson: total / splitValue
        };
      }

      return res.json({ 
        success: true, 
        data: tab,
        splitResult 
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TabController();
