const { registerUser } = require('../services/auth');
const { sendSuccess, sendError } = require('../utils/response');

async function register(request, reply) {
  try {
    const payload = request.body;
    const user = await registerUser(payload);
    // Générer le JWT via la fonction décorée sur request
    const token = await request.jwtSign(
        { id: user.id, auth_time: Math.floor(Date.now() / 1000) },
        { expiresIn: '15m' }
    );
    return sendSuccess(reply, 201, { user: { id: user.id, email: user.email }, token });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = { register };
