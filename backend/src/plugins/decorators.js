const fp = require('fastify-plugin');

async function decorators(fastify, options) {
    
    fastify.decorate('authenticate', async (request, reply) => {
        try {
        await request.jwtVerify();
        
        } catch (err) {
        reply.code(401).send({ error: 'Accès refusé' });
        }
    });
  
    fastify.decorate('verifyRefreshToken', async (request, reply) => {
        const signedRefreshTokenCookie = request.cookies.refreshToken;

        if (!signedRefreshTokenCookie) {
        return reply.code(401).send({ error: 'Refresh token cookie manquant.' });
        }

        // Check if the cookie is signed
        const unsignedCookie = request.unsignCookie(signedRefreshTokenCookie);

        if (!unsignedCookie.valid) {
            // If the signature is invalid, clear the cookie and deny access
            reply.clearCookie('refreshToken', {
              path: '/api/auth',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              signed: true 
            });
            return reply.code(403).send({ error: 'Refresh token cookie invalide (signature incorrecte).' });
        }

        // Real refresh token value
        const refreshToken = unsignedCookie.value;

        if (!refreshToken) {
            return reply.code(401).send({ error: 'Valeur du refresh token manquante après désignation.' });
        }
      
        let payload;
        try {
            payload = await fastify.jwt.verify(refreshToken);
        } catch (err) {
            reply.clearCookie('refreshToken', {
                path: '/api/auth',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                signed: true
            });
            return reply.code(403).send({ error: 'Refresh token invalide ou expiré' });
        }
    
        const user = await fastify.prisma.user.findUnique({
            where: { id: payload.id }
        });
    
        // If the user doesn't exist or the refresh token doesn't match what's in the database, deny access
        if (!user || user.refreshToken !== refreshToken) {
            reply.clearCookie('refreshToken', { 
                path: '/api/auth',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                signed: true // Important si le cookie original était signé
              });
            return reply.code(403).send({ error: 'Refresh token non reconnu' });
        }
    
        request.user = user;
    });
}
  module.exports = fp(decorators);