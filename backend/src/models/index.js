const Establishment = require('./Establishment');
const Category = require('./Category');
const Product = require('./Product');
const User = require('./User');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Review = require('./Review');

// Associations
Establishment.hasMany(Category, { foreignKey: 'establishment_id', as: 'categories' });
Category.belongsTo(Establishment, { foreignKey: 'establishment_id' });

Establishment.hasMany(Product, { foreignKey: 'establishment_id', as: 'products' });
Product.belongsTo(Establishment, { foreignKey: 'establishment_id' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Establishment.hasMany(Order, { foreignKey: 'establishment_id', as: 'orders' });
Order.belongsTo(Establishment, { foreignKey: 'establishment_id', as: 'establishment' });

Establishment.hasMany(User, { foreignKey: 'establishment_id', as: 'users' });
User.belongsTo(Establishment, { foreignKey: 'establishment_id', as: 'establishment' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Reviews Associations
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Establishment.hasMany(Review, { foreignKey: 'establishment_id', as: 'reviews' });
Review.belongsTo(Establishment, { foreignKey: 'establishment_id', as: 'establishment' });

Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Order.hasMany(Review, { foreignKey: 'order_id', as: 'reviews' });
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

module.exports = { Establishment, Category, Product, User, Order, OrderItem, Review };
