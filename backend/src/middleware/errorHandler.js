function errorHandler(error, request, reply) {
    request.log.error(error);
  
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Erreur interne du serveur';
  
    reply
      .code(statusCode)
      .send({
        error: true,
        message,
        statusCode
      });
  }
  
  module.exports = errorHandler;