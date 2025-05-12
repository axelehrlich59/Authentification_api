async function profilRoutes(fastify) {
    fastify.get('/profile', { 
      preHandler: [fastify.authenticate] 
    }, async (request) => {
        const user = await fastify.prisma.user.findUnique({
            where: { id: request.user.id },
            select: {
              id: true,
              email: true,
              createdAt: true
            }
          });
        return user || {error: "Utilisateur non trouvé"}
    });
}

module.exports = profilRoutes