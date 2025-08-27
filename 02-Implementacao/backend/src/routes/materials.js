const MaterialController = require('../controllers/MaterialController');
const { schemas } = require('../utils/validation');

async function materialRoutes(fastify, options) {
  // Middleware de autenticação para todas as rotas
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/materials - Listar materiais
  fastify.get('/', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          type: { type: 'string', enum: ['Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales'] },
          category: { type: 'string' },
          search: { type: 'string' },
          active: { type: 'string', enum: ['true', 'false'], default: 'true' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  code: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  type: { type: 'string' },
                  category: { type: 'string' },
                  price: { type: 'number' },
                  stock_quantity: { type: 'integer' },
                  unit: { type: 'string' },
                  composition: { type: 'string' },
                  color: { type: 'string' },
                  width: { type: 'number' },
                  weight: { type: 'number' },
                  active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, MaterialController.list);

  // GET /api/materials/types - Tipos de materiais têxteis
  fastify.get('/types', MaterialController.getTypes);

  // GET /api/materials/categories - Categorias disponíveis
  fastify.get('/categories', MaterialController.getCategories);

  // GET /api/materials/search - Busca rápida
  fastify.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { q, limit = 10 } = request.query;
      const MaterialService = require('../services/MaterialService');
      
      const materials = await MaterialService.searchMaterials(q, limit);
      
      reply.send({ materials });
    } catch (error) {
      request.log.error('Search materials error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro na busca de materiais'
      });
    }
  });

  // POST /api/materials - Criar material
  fastify.post('/', {
    preHandler: [fastify.authorize(['admin', 'manager'])],
    schema: {
      body: schemas.material.create
    }
  }, MaterialController.create);

  // POST /api/materials/bulk-import - Importação em lote
  fastify.post('/bulk-import', {
    preHandler: [fastify.authorize(['admin', 'manager'])],
    schema: {
      body: {
        type: 'object',
        required: ['materials'],
        properties: {
          materials: {
            type: 'array',
            items: schemas.material.create
          }
        }
      }
    }
  }, MaterialController.bulkImport);

  // GET /api/materials/:id - Buscar por ID
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, MaterialController.getById);

  // PUT /api/materials/:id - Atualizar material
  fastify.put('/:id', {
    preHandler: [fastify.authorize(['admin', 'manager'])],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: schemas.material.update
    }
  }, MaterialController.update);

  // DELETE /api/materials/:id - Desativar material
  fastify.delete('/:id', {
    preHandler: [fastify.authorize(['admin'])],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, MaterialController.delete);

  // PATCH /api/materials/:id/stock - Atualizar estoque
  fastify.patch('/:id/stock', {
    preHandler: [fastify.authorize(['admin', 'manager'])],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['quantity', 'operation'],
        properties: {
          quantity: { type: 'number', minimum: 0 },
          operation: { type: 'string', enum: ['add', 'subtract'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { quantity, operation } = request.body;
      
      const MaterialService = require('../services/MaterialService');
      const material = await MaterialService.updateStock(id, quantity, operation);
      
      if (!material) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Material não encontrado'
        });
      }
      
      reply.send({
        message: 'Estoque atualizado com sucesso',
        material
      });
    } catch (error) {
      request.log.error('Update stock error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao atualizar estoque'
      });
    }
  });

  // GET /api/materials/reports/low-stock - Materiais com estoque baixo
  fastify.get('/reports/low-stock', {
    preHandler: [fastify.authorize(['admin', 'manager'])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          threshold: { type: 'integer', minimum: 0, default: 10 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { threshold = 10 } = request.query;
      const MaterialService = require('../services/MaterialService');
      
      const materials = await MaterialService.getLowStockMaterials(threshold);
      
      reply.send({
        materials,
        threshold,
        count: materials.length
      });
    } catch (error) {
      request.log.error('Low stock report error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao gerar relatório de estoque baixo'
      });
    }
  });
}

module.exports = materialRoutes;