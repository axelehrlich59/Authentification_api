const bcrypt = require('bcrypt');

async function loginUser(prisma, email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('Identifiants invalides');
    err.statusCode = 401;
    throw err;
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    const err = new Error('Identifiants invalides');
    err.statusCode = 401;
    throw err;
  }

  return user;
}

module.exports = { loginUser };