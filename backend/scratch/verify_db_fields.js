const { Establishment } = require('../src/models');
const { sequelize } = require('../src/database');

async function run() {
  try {
    await sequelize.authenticate();
    const est = await Establishment.findOne();
    if (est) {
      console.log('✅ Registro encontrado!');
      console.log('Campos existentes no objeto Sequelize:');
      console.log('id:', est.id);
      console.log('name:', est.name);
      console.log('phone:', est.phone);
      console.log('whatsapp:', est.whatsapp);
      console.log('pixKey:', est.pixKey);
      
      // Tentar atualizar
      est.whatsapp = '11999999999';
      est.pixKey = 'test@pix.com';
      await est.save();
      console.log('✅ Sucesso ao salvar os novos campos no banco SQLite!');
      
      // Recarregar
      const reloaded = await Establishment.findByPk(est.id);
      console.log('Campos recarregados:');
      console.log('whatsapp:', reloaded.whatsapp);
      console.log('pixKey:', reloaded.pixKey);
    } else {
      console.log('❌ Nenhum estabelecimento cadastrado.');
    }
  } catch (error) {
    console.error('❌ Erro de banco de dados:', error);
  } finally {
    await sequelize.close();
  }
}

run();
