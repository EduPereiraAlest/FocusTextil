const fastify = require('fastify')({ 
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

const config = require('./config');
const { initializeDatabase } = require('./database/connection');
const { initializeRedis } = require('./utils/redis');

// Plugins e Middlewares
async function setupPlugins() {
  // CORS
  await fastify.register(require('@fastify/cors'), {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  });

  // Security Headers
  await fastify.register(require('@fastify/helmet'), {
    global: true
  });

  // JWT Authentication
  await fastify.register(require('@fastify/jwt'), {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.accessTokenExpiry
    }
  });

  // Rate Limiting
  await fastify.register(require('@fastify/rate-limit'), {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow
  });

  // Multipart (File Upload)
  await fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: config.upload.maxFileSize
    }
  });
}

// Middleware de Autenticação
fastify.decorate('authenticate', async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ 
      error: 'Unauthorized',
      message: 'Token inválido ou expirado'
    });
  }
});

// Middleware de Autorização
fastify.decorate('authorize', (roles = []) => {
  return async function(request, reply) {
    const userRole = request.user.role;
    
    if (roles.length > 0 && !roles.includes(userRole)) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Acesso negado'
      });
    }
  };
});

// Error Handler Global
fastify.setErrorHandler(function (error, request, reply) {
  this.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados inválidos',
      details: error.validation
    });
    return;
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message
    });
    return;
  }

  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor'
  });
});

// Routes
async function setupRoutes() {
  // Health Check
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  });

  // API Routes
  await fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
  await fastify.register(require('./routes/users'), { prefix: '/api/users' });
  await fastify.register(require('./routes/materials'), { prefix: '/api/materials' });
  await fastify.register(require('./routes/orders'), { prefix: '/api/orders' });
  await fastify.register(require('./routes/analytics'), { prefix: '/api/analytics' });
  await fastify.register(require('./routes/sync'), { prefix: '/api/sync' });
  await fastify.register(require('./routes/files'), { prefix: '/api/files' });
}

// Initialize Application
async function start() {
  try {
    // Setup plugins
    await setupPlugins();
    
    // Initialize Database
    await initializeDatabase();
    fastify.log.info('✅ Database connected');
    
    // Initialize Redis
    await initializeRedis();
    fastify.log.info('✅ Redis connected');
    
    // Setup routes
    await setupRoutes();
    fastify.log.info('✅ Routes registered');
    
    // Start server
    await fastify.listen({ 
      port: config.server.port, 
      host: config.server.host 
    });
    
    console.log(`
🚀 Focus Textil Backend started successfully!

📊 Server: http://${config.server.host}:${config.server.port}
🔗 Health: http://${config.server.host}:${config.server.port}/health
📚 API Docs: http://${config.server.host}:${config.server.port}/api/docs
🗄️ Database: PostgreSQL on ${config.database.host}:${config.database.port}
⚡ Cache: Redis on ${config.redis.host}:${config.redis.port}
🌍 Environment: ${config.server.env}
    `);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  start();
}

module.exports = fastify;