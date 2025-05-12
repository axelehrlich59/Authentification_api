module.exports = async function (fastify) {
    const { logout } = require('../controllers/logout');
    fastify.post('/logout', { preHandler: [fastify.authenticate] }, logout);
  };