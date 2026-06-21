const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Category = sequelize.define('Category', {
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
  icon: {
    type: DataTypes.STRING,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  station: {
    type: DataTypes.ENUM('kitchen', 'bar'),
    defaultValue: 'kitchen',
  },
  establishmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'establishment_id',
  },
}, {
  tableName: 'categories',
  underscored: true,
  indexes: [
    {
      fields: ['establishment_id']
    }
  ]
});

module.exports = Category;
