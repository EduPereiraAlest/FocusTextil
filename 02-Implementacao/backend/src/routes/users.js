const UserService = require('../services/UserService');

async function userRoutes(fastify, options) {
  // Middleware de autenticação
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/users - Listar usuários (apenas admin)
  fastify.get('/', {
    preHandler: [fastify.authorize(['admin'])]
  }, async (request, reply) => {
    try {
      const { page = 1, limit = 20, role, search, active } = request.query;
      const filters = { role, search, active: active === 'true' };
      
      const result = await UserService.list(parseInt(page), parseInt(limit), filters);
      
      reply.send({
        users: result.users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      request.log.error('List users error:', error);
      reply.code(500).send({ error: 'Erro ao buscar usuários' });
    }
  });

  // GET /api/users/stats - Estatísticas (admin/manager)
  fastify.get('/stats', {
    preHandler: [fastify.authorize(['admin', 'manager'])]
  }, async (request, reply) => {
    try {
      const stats = await UserService.getUserStats();
      reply.send({ stats });
    } catch (error) {
      request.log.error('Get user stats error:', error);
      reply.code(500).send({ error: 'Erro ao buscar estatísticas' });
    }
  });
}

module.exports = userRoutes;