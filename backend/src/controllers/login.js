const { loginUser } = require('../services/login');
const { sendSuccess, sendError } = require('../utils/response');

async function login(request, reply) {
  try {
    const { email, password } = request.body;
    const user = await loginUser(request.server.prisma, email, password);

    const accessToken = request.server.jwt.sign(
      { id: user.id },
      { expiresIn: '15m' }
    );
    const refreshToken = request.server.jwt.sign(
      { id: user.id },
      { expiresIn: '7d' }
    );

    await request.server.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    return sendSuccess(reply, 200, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = { login };