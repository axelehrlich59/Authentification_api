const bcrypt = require('bcrypt');

module.exports = async function (fastify) {
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
      const token = fastify.jwt.sign({ id: user.id });

      return { token };

    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
};