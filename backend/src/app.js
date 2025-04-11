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
fastify.register(require('./routes/users'));
fastify.register(require('./routes/profile'));

// Decorations 
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
    
  } catch (err) {
    // Si échec, on bloque l'accès
    reply.code(401).send({ error: 'Accès refusé' });
  }
});

// Démarrage
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log(`Server running on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

fastify.addHook('onReady', async () => {
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅' : '❌');
});

console.log('✅ Server is alive!');

start();