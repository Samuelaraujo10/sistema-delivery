const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price',
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
}, {
  tableName: 'order_items',
  underscored: true,
});

module.exports = OrderItem;
