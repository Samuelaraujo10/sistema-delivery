const { User, Establishment } = require('../src/models');
const { sequelize } = require('../src/database');

async function setup() {
  try {
    await sequelize.authenticate();
    
    const rafaBistro = await Establishment.findOne({ where: { name: 'Rafa Bistrô' } });
    if (!rafaBistro) {
      console.error('Restaurante Rafa Bistrô não encontrado. Rode o seed primeiro.');
      return;
    }

    // 1. Criar ou atualizar Lojista Demo (Rafa Lojista)
    const [lojista, lojistaCreated] = await User.findOrCreate({
      where: { email: 'rafa@delivery.com' },
      defaults: {
        name: 'Rafa Lojista',
        password: 'admin',
        role: 'admin',
        establishmentId: rafaBistro.id
      }
    });

    if (!lojistaCreated) {
      await lojista.update({
        name: 'Rafa Lojista',
        role: 'admin',
        establishmentId: rafaBistro.id,
        password: 'admin' // vai ser hasheado pelo hook
      });
    }

    console.log('✅ Lojista configurado!');
    console.log('E-mail: rafa@delivery.com');
    console.log('Senha: admin');
    console.log('Restaurante vinculado:', rafaBistro.name);

    // 2. Criar ou atualizar Cliente Demo (João Silva)
    const [cliente, clienteCreated] = await User.findOrCreate({
      where: { email: 'joao@email.com' },
      defaults: {
        name: 'João Silva',
        email: 'joao@email.com',
        password: '123456',
        phone: '(11) 98888-7777',
        role: 'customer',
        establishmentId: null
      }
    });

    if (!clienteCreated) {
      await cliente.update({
        name: 'João Silva',
        role: 'customer',
        establishmentId: null,
        password: '123456'
      });
    }

    console.log('\n✅ Cliente Demo configurado!');
    console.log('E-mail: joao@email.com');
    console.log('Senha: 123456');

    // 3. Criar ou atualizar Super Admin Demo (admin@delivery.com)
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@delivery.com' },
      defaults: {
        name: 'Admin Global',
        password: '123456',
        role: 'admin',
        establishmentId: null
      }
    });

    if (!adminCreated) {
      await admin.update({
        name: 'Admin Global',
        role: 'admin',
        establishmentId: null,
        password: '123456'
      });
    }

    console.log('\n✅ Admin Global configurado!');
    console.log('E-mail: admin@delivery.com');
    console.log('Senha: 123456');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

setup();
