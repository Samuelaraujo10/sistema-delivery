const { Product } = require('../src/models');
const { sequelize } = require('../src/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco SQLite estabelecida.');

    await Product.update({ image: null }, { where: {} });
    console.log('🎉 Sucesso! Coluna de imagens limpa. O cardápio voltará a renderizar os stickers/logos de marca originais.');
  } catch (error) {
    console.error('❌ Erro ao limpar as imagens:', error);
  } finally {
    await sequelize.close();
  }
}

run();
