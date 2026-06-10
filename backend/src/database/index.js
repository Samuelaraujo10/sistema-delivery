const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine the dialect: default to SQLite unless a DATABASE_URL or explicit DB_DIALECT is provided
const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

// Common Sequelize options shared between the URL and SQLite configurations
const commonOptions = {
  dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

// Initialise Sequelize – support for a full DATABASE_URL (e.g., PostgreSQL) or a local SQLite file
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

// ---------------------------------------------------------------------------
// SQLite optimisation: enable Write‑Ahead Logging (WAL) and increase busy timeout
// This reduces lock contention when multiple requests try to write concurrently –
// a common source of `SQLITE_BUSY: database is locked` errors, especially when
// the Pix payment flow triggers rapid consecutive writes.
// ---------------------------------------------------------------------------
if (dialect === 'sqlite') {
  // Run pragmas once the connection is ready
  (async () => {
    try {
      // Enable WAL mode – allows readers and writers to operate simultaneously
      await sequelize.query('PRAGMA journal_mode = WAL;');
      // Extend the timeout so SQLite will wait for a lock to be released
      await sequelize.query('PRAGMA busy_timeout = 5000;'); // 5 seconds
      console.log('SQLite pragmas applied: WAL mode and busy_timeout=5000ms');
    } catch (err) {
      console.error('Failed to apply SQLite pragmas:', err);
    }
  })();
}

module.exports = { sequelize };

