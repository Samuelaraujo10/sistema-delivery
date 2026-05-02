require('express-async-errors');
const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('./database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Necessário para servir imagens do local uploads
}));
app.use(morgan('dev'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rotas
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error Handler (Deve ser o último middleware)
app.use(errorHandler);

// Inicializar banco e servidor
sequelize.sync().then(async () => {
  console.log('✅ Banco de dados sincronizado');
  const { seedDatabase } = require('./database/seeders');
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('❌ Erro ao conectar ao banco:', err);
});
