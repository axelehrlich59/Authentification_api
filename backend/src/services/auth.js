const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateVerificationToken } = require('./emailVerification');

async function registerUser(prisma, userData) {

  if (!userData || !Object.keys(userData).length) {
    const error = new Error('Données utilisateur manquantes');
    error.statusCode = 400;
    throw error;
  }

  const { email, password } = userData;
  
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    const error = new Error('Cet email est déjà utilisé');
    error.statusCode = 409;
    throw error;
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      isVerified: false
    }
  });
  
  await generateVerificationToken(prisma, user.id, email);
  
  return user;
}

module.exports = { 
  registerUser,
};
