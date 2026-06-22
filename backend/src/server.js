require('express-async-errors');
const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize } = require('./database');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Necessário para servir imagens do local uploads
}));
app.use(morgan('dev'));
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (ex: Postman), localhost e qualquer domínio Vercel
    if (!origin || origin === 'http://localhost:5173' || origin.endsWith('.vercel.app') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Configuração do Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Ajuste conforme necessário em produção
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Novo cliente conectado: ${socket.id}`);
  
  // Exemplo de join room por estabelecimento
  socket.on('join_establishment', (establishmentId) => {
    socket.join(`establishment_${establishmentId}`);
    console.log(`Cliente ${socket.id} entrou na sala do estabelecimento: ${establishmentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente desconectado: ${socket.id}`);
  });
});

// Middleware para injetar o io nas rotas
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
  
  try {
    // Forçar a adição do enum 'bar' no Postgres já que desativamos o alter: true
    await sequelize.query(`ALTER TYPE "enum_establishments_type" ADD VALUE IF NOT EXISTS 'bar'`);
    console.log('✅ Enum bar garantido no banco');
  } catch (err) {
    console.log('⚠️ Aviso ao adicionar enum (pode já existir):', err.message);
  }

  const { seedDatabase } = require('./database/seeders');
  await seedDatabase();
  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 API disponível em http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('❌ Erro ao conectar ao banco:', err);
});
