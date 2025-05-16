const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/mailer');

/**
 * Génère un token de vérification et l'envoie par email
 * @param {Object} prisma - Instance Prisma
 * @param {string} userId - ID de l'utilisateur
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise} - Résultat de l'opération
 */
async function generateVerificationToken(prisma, userId, email, callbackUrl = null) {

  const token = crypto.randomBytes(32).toString('hex');
  
  // Date d'expiration (24h)
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      emailVerificationCallback: callbackUrl
    }
  });
  
  return sendVerificationEmail(email, token, callbackUrl);
}

/**
 * Vérifie un token de vérification d'email
 * @param {Object} prisma - Instance Prisma
 * @param {string} token - Token à vérifier
 * @returns {Promise<Object>} - Utilisateur vérifié ou null
 */
async function verifyEmailToken(prisma, token) {
  // Cherche un utilisateur avec ce token non expiré
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: {
        gt: new Date()
      }
    }
  });
  
  if (!user) {
    const error = new Error('Token invalide ou expiré');
    error.statusCode = 400;
    throw error;
  }
  
  // Marque l'utilisateur comme vérifié et supprime le token
  return prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    }
  });
}

/**
 * Renvoie un email de vérification
 * @param {Object} prisma - Instance Prisma
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise} - Résultat de l'opération
 */
async function resendVerificationEmail(prisma, email) {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    const error = new Error('Utilisateur non trouvé');
    error.statusCode = 404;
    throw error;
  }
  
  if (user.isVerified) {
    const error = new Error('Cet email est déjà vérifié');
    error.statusCode = 400;
    throw error;
  }
  
  return generateVerificationToken(prisma, user.id, email);
}

module.exports = {
  generateVerificationToken,
  verifyEmailToken,
  resendVerificationEmail
};