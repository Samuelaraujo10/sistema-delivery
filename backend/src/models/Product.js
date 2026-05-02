const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'original_price',
  },
  image: {
    type: DataTypes.STRING,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    field: 'preparation_time',
  },
  builderRole: {
    type: DataTypes.ENUM(
      'massa', 'molho', 'proteina', 'topping', 
      'tamanho', 'fruta', 'complemento', 'calda', 'creme',
      'sabor', 'borda', 'none'
    ),
    defaultValue: 'none',
    field: 'builder_role',
  },
  modifierGroups: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'modifier_groups',
  },
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id',
  },
  establishmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'establishment_id',
  },
}, {
  tableName: 'products',
  underscored: true,
});

module.exports = Product;
