const bcrypt = require('bcrypt');

module.exports = async function (fastify) {

  // REGISTER USER
  fastify.post('/register', {
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
      
      // Vérification existence utilisateur
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Hash mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      console.log('Hashing...');
      const hashed = await bcrypt.hash('test', 10);
      console.log('Hash result:', hashed);

      // Création utilisateur
      const user = await fastify.prisma.user.create({
        data: {
          email,
          password: hashedPassword
        }
      });

      // Génération JWT
      const token = fastify.jwt.sign({ 
        id: user.id,
        email: user.email 
      });

      return { token };

    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

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