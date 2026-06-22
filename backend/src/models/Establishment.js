const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Establishment = sequelize.define('Establishment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('acai', 'pizza', 'burger', 'sushi', 'mexican', 'chinese', 'bakery', 'pasta', 'bar', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  plan: {
    type: DataTypes.ENUM('delivery', 'pro'),
    allowNull: false,
    defaultValue: 'delivery',
  },
  description: {
    type: DataTypes.TEXT,
  },
  logo: {
    type: DataTypes.STRING,
  },
  coverImage: {
    type: DataTypes.STRING,
    field: 'cover_image',
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#6C63FF',
    field: 'primary_color',
  },
  secondaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#FF6584',
    field: 'secondary_color',
  },
  address: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  whatsapp: {
    type: DataTypes.STRING,
  },
  pixKey: {
    type: DataTypes.STRING,
    field: 'pix_key',
  },
  deliveryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'delivery_fee',
  },
  minOrder: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'min_order',
  },
  deliveryTime: {
    type: DataTypes.INTEGER,
    defaultValue: 40,
    field: 'delivery_time',
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0,
  },
  isOpen: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_open',
  },
  hasBuilder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'has_builder',
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'establishments',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['active']
    }
  ]
});

module.exports = Establishment;
