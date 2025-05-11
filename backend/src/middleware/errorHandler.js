function errorHandler(error, request, reply) {
    // Log l'erreur côté serveur
    request.log.error(error);
  
    // Personnalise la réponse selon le type d'erreur
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