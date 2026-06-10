const { sequelize } = require('../src/database');
require('../src/models'); // Garante que todos os modelos são registrados

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida.');

    // Sincroniza alterando as colunas
    await sequelize.sync({ alter: true });
    console.log('🎉 Banco de dados sincronizado com sucesso! Novas colunas (whatsapp e pix_key) foram criadas na tabela de estabelecimentos.');
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  } finally {
    await sequelize.close();
  }
}

run();
