const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (fastify) {

  // REGISTER USER
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
  }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      const normalizedEmail = email.trim().toLowerCase();
  
      // Vérification existence utilisateur
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
  
      if (existingUser) {
        return reply.code(400).send({ error: 'Email déjà utilisé' });
      }
  
      // Hachage du mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);
  
      // Création utilisateur
      const user = await fastify.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          isVerified: false
        },
        select: { id: true, email: true }
      });
  
      // Génération JWT
      const token = fastify.jwt.sign(
        { 
          id: user.id,
          auth_time: Math.floor(Date.now() / 1000)
        }, 
        { 
          expiresIn: '15m',
          issuer: 'votre-domaine.com'
        }
      );
  
      // Headers de sécurité
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
  
      // Réponse 201 Created
      return reply.code(201).send({
        token,
        user: {
          id: user.id,
          email: user.email
        }
      });
  
    } catch (error) {
      fastify.log.error({
        message: 'Erreur complète',
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          prismaCode: error.code
        },
        request: {
          body: request.body
        }
      });
  
      // Réponse d'erreur obligatoire
      reply.code(500).send({
        error: 'Erreur serveur',
        code: 'INTERNAL_ERROR'
      });
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