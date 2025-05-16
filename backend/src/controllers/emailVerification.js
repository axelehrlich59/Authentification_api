const { verifyEmailToken, resendVerificationEmail } = require('../services/emailVerification');
const { sendSuccess, sendError } = require('../utils/response');


async function verifyEmail(request, reply) {
  try {
    const { token } = request.query;
    
    if (!token) {
      return sendError(reply, { statusCode: 400, message: 'Token manquant' });
    }
    
    const user = await verifyEmailToken(request.server.prisma, token);
    const redirectUrl = user.emailVerificationCallback || 
    process.env.FRONTEND_URL || 
    'http://localhost:3000';
    return reply
      .type('text/html')
      .send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email vérifié</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              max-width: 500px;
            }
            h1 {
              color: #4CAF50;
            }
            p {
              margin: 1rem 0;
              line-height: 1.5;
            }
            .icon {
              font-size: 4rem;
              color: #4CAF50;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✓</div>
            <h1>Email vérifié avec succès !</h1>
            <p>Votre adresse email a été confirmée. Vous pouvez maintenant vous connecter à votre compte.</p>
            <p>Vous pouvez fermer cette page.</p>
          </div>
        </body>
        </html>
      `);
  } catch (err) {
    return sendError(reply, err);
  }
}


async function resendVerification(request, reply) {
  try {
    const { email } = request.body;
    
    if (!email) {
      return sendError(reply, { statusCode: 400, message: 'Email manquant' });
    }
    
    await resendVerificationEmail(request.server.prisma, email);
    return sendSuccess(reply, 200, { message: 'Email de vérification renvoyé' });
  } catch (err) {
    return sendError(reply, err);
  }
}

module.exports = {
  verifyEmail,
  resendVerification
};