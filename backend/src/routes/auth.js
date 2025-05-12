const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { register } = require('../controllers/auth');


module.exports = async function (fastify) {


  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 254
          },
          password: { 
            type: 'string', 
            minLength: 12,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$'
          }
        }
      }
    }
  }, register);

  // REFRESH TOKEN 

  fastify.post('/refresh', {
    // Utilisation du middleware
    preHandler: [fastify.verifyRefreshToken]
  }, async (request, reply) => {
    try {
      const { user } = request;
  
      // Générer nouveau access token
      const newAccessToken = fastify.jwt.sign(
        { id: user.id }, 
        { expiresIn: '15m' }
      );
  
      // Générer nouveau refresh token (rotation)
      const newRefreshToken = fastify.jwt.sign(
        { id: user.id }, 
        { expiresIn: '7d' }
      );
  
      // Mettre à jour en base
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken }
      });
  
      return { 
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
  
    } catch (error) {
      fastify.log.error('Refresh error:', error);
      reply.code(500).send({ error: 'Erreur de rafraîchissement' });
    }
  });


};