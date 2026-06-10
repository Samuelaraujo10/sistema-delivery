const { User } = require('../src/models');
const { sequelize } = require('../src/database');

async function listUsers() {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ attributes: ['id', 'name', 'email', 'phone', 'role', 'establishmentId'] });
    console.log("USERS IN DATABASE:");
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await sequelize.close();
  }
}

listUsers();
