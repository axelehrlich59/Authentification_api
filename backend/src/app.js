const fastify = require('fastify')({ 
  logger: {
    level: 'debug',
    transport: {
      target: 'pino-pretty'
    }
  }
});
require('dotenv').config();

// Plugins
fastify.register(require('@fastify/cors'), { 
  origin: process.env.NODE_ENV === 'development' ? '*' : /votredomaine\.com$/
});

fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET
});

fastify.register(require('@fastify/cookie'), {
  secret: process.env.COOKIE_SECRET, 
  parseOptions: {}
});

fastify.register(require('./plugins/decorators'));

// Database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Décorer l'instance Fastify avec Prisma
fastify.decorate('prisma', prisma);

// Fermer la connexion à l'arrêt
fastify.addHook('onClose', async (instance) => {
  await instance.prisma.$disconnect();
});

prisma.$queryRaw`SELECT 1+1 AS test`
  .then(() => console.log('✅ Database connection OK'))
  .catch(e => console.error('❌ Database connection failed', e));

// Routes imports
fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./routes/login'), {prefix: '/api/auth' });
fastify.register(require('./routes/token'), { prefix: '/api/auth' });
fastify.register(require('./routes/profile'));
fastify.register(require('./routes/logout'), {prefix: '/api/auth' });
fastify.register(require('./routes/emailVerification'), { prefix: '/api/auth' });

// Middlewares 
const errorHandler = require('./middleware/errorHandler');
fastify.setErrorHandler(errorHandler);

// Decorations 


// Démarrage
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();