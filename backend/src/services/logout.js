const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function logoutUser(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });
}

module.exports = { logoutUser };