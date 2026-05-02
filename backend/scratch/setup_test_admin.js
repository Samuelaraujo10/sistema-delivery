const { User, Establishment } = require('../src/models');
const { sequelize } = require('../src/database');

async function setup() {
  try {
    await sequelize.authenticate();
    
    const pastaCo = await Establishment.findOne({ where: { name: 'Pasta & Co.' } });
    
    if (!pastaCo) {
      console.error('Restaurante Pasta & Co. não encontrado. Rode o seed primeiro.');
      return;
    }

    // Criar ou atualizar admin restrito
    const [user, created] = await User.findOrCreate({
      where: { email: 'adminpasta@delivery.com' },
      defaults: {
        name: 'Admin Pasta & Co',
        password: 'admin',
        role: 'admin',
        establishmentId: pastaCo.id
      }
    });

    if (!created) {
      await user.update({
        role: 'admin',
        establishmentId: pastaCo.id,
        password: 'admin' // vai ser hasheado pelo hook
      });
    }

    console.log('✅ Admin restrito configurado!');
    console.log('E-mail: adminpasta@delivery.com');
    console.log('Senha: admin');
    console.log('Restaurante vinculado:', pastaCo.name);

    // Criar ou atualizar admin global (Super Admin)
    const [superUser, superCreated] = await User.findOrCreate({
      where: { email: 'superadmin@delivery.com' },
      defaults: {
        name: 'Super Admin',
        password: 'admin',
        role: 'admin',
        establishmentId: null
      }
    });
    
    if (!superCreated) {
       await superUser.update({
         role: 'admin',
         establishmentId: null,
         password: 'admin'
       });
    }

    console.log('\n✅ Super Admin configurado!');
    console.log('E-mail: superadmin@delivery.com');
    console.log('Senha: admin');
    console.log('Acesso: Global');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

setup();
