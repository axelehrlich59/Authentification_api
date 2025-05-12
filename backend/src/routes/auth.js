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

  // LOGIN USER
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;

      // Vérifier si l'utilisateur existe
      const user = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return reply.code(401).send({ error: 'Identifiants invalides' });
      }

      // Vérifier le mot de passe
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return reply.code(401).send({ error: 'Identifiants invalides' });
      }

      // Générer les tokens
      const accessToken = fastify.jwt.sign(
        { id: user.id }, 
        { expiresIn: '15m' }
      );
      
      const refreshToken = fastify.jwt.sign(
        { id: user.id }, 
        { expiresIn: '7d' }
      );

      // Stocker le refresh token généré en base
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      return { 
        accessToken, 
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Erreur serveur' });
    }
  });

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