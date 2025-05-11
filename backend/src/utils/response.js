function sendSuccess(reply, statusCode, data) {
    reply.code(statusCode).send({ status: 'success', data });
}
  
  /**
   * @param {Object} reply - Instance de Fastify reply
   * @param {Error} error - Objet Error
   */

function sendError(reply, error) {
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
      status: 'error',
      message: error.message || 'Erreur interne du serveur'
    });
}
  
module.exports = { sendSuccess, sendError };