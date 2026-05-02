const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Zod Validation Errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Sequelize Errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Erro de banco de dados',
      errors: err.errors.map(e => ({
        path: e.path,
        message: e.message
      }))
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  // Default Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
