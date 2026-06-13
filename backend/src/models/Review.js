const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  establishment_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false, // Must be linked to an order to prevent spam
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true, // Null means it's an establishment review
  }
}, {
  tableName: 'reviews',
  timestamps: true,
});

module.exports = Review;
