const { loginUser } = require('../services/login');
const { sendSuccess, sendError } = require('../utils/response');

async function login(request, reply) {
  try {
    const { email, password } = request.body;
    const user = await loginUser(request.server.prisma, email, password);

    // Generate access token
    const accessToken = request.server.jwt.sign(
      { id: user.id },
      { expiresIn: '15m' }
    );
    // Generate refresh token
    const refreshToken = request.server.jwt.sign(
      { id: user.id },
      { expiresIn: '7d' }
    );

    await request.server.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    reply.setCookie('refreshToken', refreshToken, {
      path: '/api/auth', 
      httpOnly: true,   // prevent JavaScript access to the cookie on the client side
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // Life duration of the cookie in milliseconds
      signed: true, // Sign the cookie
    });

    return sendSuccess(reply, 200, {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = { login };