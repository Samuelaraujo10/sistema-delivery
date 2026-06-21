const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Tab = sequelize.define('Tab', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tabNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tab_number',
  },
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open',
  },
  establishmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'establishment_id',
  },
  openedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'opened_at',
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'closed_at',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  }
}, {
  tableName: 'tabs',
  underscored: true,
  indexes: [
    {
      fields: ['establishment_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Tab;
