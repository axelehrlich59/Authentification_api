const { sendSuccess, sendError } = require('../utils/response');

module.exports = async function (fastify) {
    fastify.post('/refresh-token', {
        preHandler: [fastify.verifyRefreshToken]
    }, async (request, reply) => {
        try {
            // verifyRefreshToken has validated the refresh token
            const { user } = request;
        
            const newAccessToken = fastify.jwt.sign(
              { id: user.id }, 
              { expiresIn: '15m' }
            );
        
            const newRefreshToken = fastify.jwt.sign(
              { id: user.id }, 
              { expiresIn: '7d' }
            );
      
            await fastify.prisma.user.update({
              where: { id: user.id },
              data: { refreshToken: newRefreshToken }
            });
      
            // Set the new refresh token in the cookie
            reply.setCookie('refreshToken', newRefreshToken, {
              path: '/api/auth',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
              signed: true 
            });
        
            // Return the new access token
            return sendSuccess(reply, 200, { accessToken: newAccessToken });
        
          } catch (error) {
            fastify.log.error('Refresh error:', error);
            return sendError(reply, { statusCode: 500, message: 'Erreur interne du serveur lors du rafraîchissement du token.' });
          }
    });
}