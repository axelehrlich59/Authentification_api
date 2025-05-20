const { register } = require('../controllers/auth');


module.exports = async function (fastify) {
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 254
          },
          password: { 
            type: 'string', 
            minLength: 12,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{12,}$'
          }
        }
      }
    }
  }, register);
};