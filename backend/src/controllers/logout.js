const { logoutUser } = require('../services/logout');
const { sendSuccess, sendError } = require('../utils/response');

async function logout(request, reply) {
  try {
    const userId = request.user.id;
    await logoutUser(userId);
    return sendSuccess(reply, 200, { message: 'Déconnexion réussie' });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = { logout };