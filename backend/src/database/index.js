const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

const commonOptions = {
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      ...commonOptions,
      dialectOptions: process.env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    })
  : new Sequelize({
      ...commonOptions,
      storage: process.env.DB_STORAGE || './src/database/delivery.sqlite',
    });

module.exports = { sequelize };
