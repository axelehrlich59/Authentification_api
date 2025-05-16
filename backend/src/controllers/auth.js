const { registerUser } = require('../services/auth');
const { sendSuccess, sendError } = require('../utils/response');

async function register(request, reply) {
  try {
    const user = await registerUser(request.server.prisma, request.body);
    const token = await reply.server.jwt.sign(
        { id: user.id, auth_time: Math.floor(Date.now() / 1000) },
        { expiresIn: '15m' }
    );
    return sendSuccess(reply, 201, { user: { id: user.id, email: user.email }, token });
  } catch (err) {
    request.log.error({
      message: 'Erreur complète',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        prismaCode: err.code
      },
      request: {
        body: request.body
      }
    });
    return sendError(reply, err);
  }
}

module.exports = { register };
