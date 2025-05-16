const { verifyEmail, resendVerification } = require('../controllers/emailVerification');

module.exports = async function (fastify) {
  fastify.get('/verify-email', verifyEmail);
  
  fastify.post('/resend-verification', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, resendVerification);
};