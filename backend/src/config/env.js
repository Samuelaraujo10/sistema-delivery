const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET deve ter pelo menos 10 caracteres'),
  DB_DIALECT: z.enum(['sqlite', 'postgres', 'mysql']).default('sqlite'),
  // Adicione outras variáveis aqui
});

const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (err) {
    console.error('❌ Erro nas variáveis de ambiente:');
    err.errors.forEach(e => {
      console.error(`   - ${e.path.join('.')}: ${e.message}`);
    });
    process.exit(1);
  }
};

module.exports = validateEnv();
