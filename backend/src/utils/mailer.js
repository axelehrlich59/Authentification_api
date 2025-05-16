const nodemailer = require('nodemailer');

let transporter;

if (process.env.NODE_ENV === 'production') {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
} else {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.DEV_EMAIL_USER || 'ryann.labadie@ethereal.email',
      pass: process.env.DEV_EMAIL_PASS || 'jstdDrMk7VvjE65Ruj'
    }
  });
}

/**
 * Envoie un email de vérification
 * @param {string} to - Adresse email du destinataire
 * @param {string} token - Token de vérification
 * @returns {Promise} - Résultat de l'envoi
 */

async function sendVerificationEmail(to, token, callbackUrl = null) {
  const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Ton Application" <${process.env.EMAIL_FROM || 'noreply@tonapplication.com'}>`,
    to,
    subject: 'Vérification de ton adresse email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue sur Ton Application !</h2>
        <p>Merci de t'être inscrit. Pour activer ton compte, clique sur le lien ci-dessous :</p>
        <p>
          <a 
            href="${verificationUrl}" 
            style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;"
          >
            Vérifier mon email
          </a>
        </p>
        <p>Ou copie-colle ce lien dans ton navigateur :</p>
        <p>${verificationUrl}</p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>Si tu n'as pas créé de compte, tu peux ignorer cet email.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };