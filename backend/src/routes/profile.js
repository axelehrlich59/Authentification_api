async function profilRoutes(fastify) {
    fastify.get('/profile', {
        onRequest: [fastify.authenticate] // Middleware
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