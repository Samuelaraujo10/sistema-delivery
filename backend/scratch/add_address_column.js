const { sequelize } = require('../src/database');

async function run() {
  try {
    await sequelize.authenticate();
    // Check if column already exists
    const [results] = await sequelize.query("PRAGMA table_info(users);");
    const hasAddress = results.some(column => column.name === 'address');
    if (!hasAddress) {
      await sequelize.query("ALTER TABLE users ADD COLUMN address TEXT;");
      console.log("✅ Column 'address' added to 'users' table successfully.");
    } else {
      console.log("ℹ️ Column 'address' already exists in 'users' table.");
    }
  } catch (error) {
    console.error("❌ Error adding column:", error);
  } finally {
    await sequelize.close();
  }
}

run();
