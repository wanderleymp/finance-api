const { logger } = require('../middlewares/logger');

function handleDatabaseError(error) {
  logger.error('Erro no banco de dados', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    detail: error.detail
  });

  // Tratamento de erros específicos do PostgreSQL
  switch (error.code) {
    case '23505': // unique_violation
      return new Error('Registro já existe');
    case '23503': // foreign_key_violation
      return new Error('Violação de chave estrangeira');
    case '22P02': // invalid_text_representation
      return new Error('Valor inválido para o campo');
    case '23502': // not_null_violation
      return new Error('Campo obrigatório não preenchido');
    default:
      return error;
  }
}

function handleResponseError(res, error) {
  logger.error('Erro na requisição', {
    message: error.message,
    stack: error.stack
  });

  const statusCode = error.statusCode || 500;
  const errorResponse = {
    success: false,
    message: error.message || 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  handleDatabaseError,
  handleResponseError
};
