const { sequelize } = require('../src/database');
const { seedDatabase } = require('../src/database/seeders');

async function forceSeed() {
  try {
    console.log('🔄 Resetando banco de dados (DROP & CREATE)...');
    await sequelize.sync({ force: true });
    console.log('✅ Banco limpo.');
    
    await seedDatabase();
    console.log('✨ Seed finalizado com sucesso!');
    
    // Agora recriar os admins de teste
    const { User, Establishment } = require('../src/models');
    const pastaCo = await Establishment.findOne({ where: { name: 'Pasta & Co.' } });
    
    await User.create({
      name: 'Admin Pasta & Co',
      email: 'adminpasta@delivery.com',
      password: 'admin',
      role: 'admin',
      establishmentId: pastaCo.id
    });
    
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@delivery.com',
      password: 'admin',
      role: 'admin',
      establishmentId: null
    });
    
    console.log('👥 Admins de teste recriados.');

  } catch (error) {
    console.error('❌ Erro no reset:', error);
  } finally {
    await sequelize.close();
  }
}

forceSeed();
