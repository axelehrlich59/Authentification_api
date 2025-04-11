async function userRoutes(fastify) {
    fastify.get('/users', async (request, reply) => {
      try {
        const users = await fastify.prisma.user.findMany();
        return users;
      } catch (error) {
        reply.code(500).send({ error: 'Erreur de base de données' });
      }
    });
  }
  
  module.exports = userRoutes;