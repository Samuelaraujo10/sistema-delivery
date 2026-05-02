const { User } = require('../src/models');
const { sequelize } = require('../src/database');
const bcrypt = require('bcryptjs');

async function reset() {
  try {
    await sequelize.authenticate();
    
    const users = ['adminpasta@delivery.com', 'superadmin@delivery.com'];
    
    for (const email of users) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        // Hashing manualmente para garantir
        const hashedPassword = await bcrypt.hash('admin', 10);
        await user.update({ password: hashedPassword }, { hooks: false });
        console.log(`✅ Senha resetada para ${email}`);
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

reset();
