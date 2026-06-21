const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    field: 'order_number',
  },
  type: {
    type: DataTypes.ENUM('delivery', 'dine_in', 'takeaway'),
    defaultValue: 'delivery',
  },
  tableNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'table_number',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'delivery_fee',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'pix'),
    field: 'payment_method',
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    field: 'delivery_address',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  establishmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'establishment_id',
  },
  tabId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'tab_id',
  },
}, {
  tableName: 'orders',
  underscored: true,
  hooks: {
    beforeCreate: (order) => {
      const num = Math.floor(Math.random() * 90000) + 10000;
      order.orderNumber = `#${num}`;
    },
  },
  indexes: [
    {
      fields: ['establishment_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = Order;
