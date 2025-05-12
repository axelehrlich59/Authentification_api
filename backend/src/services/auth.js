const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('Email déjà utilisé');
    err.statusCode = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: hashed, isVerified: false }
  });

  return user;
}

module.exports = { 
  registerUser,
};
