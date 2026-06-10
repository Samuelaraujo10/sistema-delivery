const { Establishment } = require('../src/models');
const { sequelize } = require('../src/database');

async function run() {
  try {
    await sequelize.authenticate();
    const establishments = await Establishment.findAll({ raw: true });
    console.log('ESTABLISHMENTS IN DB:');
    console.log(JSON.stringify(establishments, null, 2));
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await sequelize.close();
  }
}

run();
