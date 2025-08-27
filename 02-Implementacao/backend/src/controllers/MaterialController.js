const MaterialService = require('../services/MaterialService');
const { validateUUID } = require('../utils/validation');

class MaterialController {
  // GET /api/materials
  async list(request, reply) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        search,
        active = 'true'
      } = request.query;

      const filters = {
        type,
        category,
        search,
        active: active === 'true'
      };

      const result = await MaterialService.list(
        parseInt(page),
        parseInt(limit),
        filters
      );

      reply.send({
        materials: result.materials,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    } catch (error) {
      request.log.error('List materials error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao buscar materiais'
      });
    }
  }

  // GET /api/materials/:id
  async getById(request, reply) {
    try {
      const { id } = request.params;

      if (!validateUUID(id)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'ID inválido'
        });
      }

      const material = await MaterialService.findById(id);

      if (!material) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Material não encontrado'
        });
      }

      reply.send({ material });
    } catch (error) {
      request.log.error('Get material error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao buscar material'
      });
    }
  }

  // POST /api/materials
  async create(request, reply) {
    try {
      const {
        code,
        name,
        description,
        type = 'Geral',
        category,
        price,
        stockQuantity = 0,
        unit = 'metros',
        composition,
        color,
        width,
        weight
      } = request.body;

      // Validações obrigatórias
      if (!code || !name) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Código e nome são obrigatórios'
        });
      }

      // Validar tipo específico têxtil
      const validTypes = ['Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales'];
      if (!validTypes.includes(type)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: `Tipo deve ser um dos: ${validTypes.join(', ')}`
        });
      }

      // Verificar se código já existe
      const existingMaterial = await MaterialService.findByCode(code);
      if (existingMaterial) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Código já está em uso'
        });
      }

      const materialData = {
        code,
        name,
        description,
        type,
        category,
        price: price ? parseFloat(price) : null,
        stockQuantity: parseInt(stockQuantity),
        unit,
        composition,
        color,
        width: width ? parseFloat(width) : null,
        weight: weight ? parseFloat(weight) : null
      };

      const material = await MaterialService.create(materialData);

      reply.code(201).send({
        message: 'Material criado com sucesso',
        material
      });
    } catch (error) {
      request.log.error('Create material error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao criar material'
      });
    }
  }

  // PUT /api/materials/:id
  async update(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      if (!validateUUID(id)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'ID inválido'
        });
      }

      const existingMaterial = await MaterialService.findById(id);
      if (!existingMaterial) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Material não encontrado'
        });
      }

      // Verificar se código já está em uso por outro material
      if (updateData.code && updateData.code !== existingMaterial.code) {
        const materialWithCode = await MaterialService.findByCode(updateData.code);
        if (materialWithCode && materialWithCode.id !== id) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Código já está em uso'
          });
        }
      }

      // Validar tipo se fornecido
      if (updateData.type) {
        const validTypes = ['Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales'];
        if (!validTypes.includes(updateData.type)) {
          return reply.code(400).send({
            error: 'Validation Error',
            message: `Tipo deve ser um dos: ${validTypes.join(', ')}`
          });
        }
      }

      const material = await MaterialService.update(id, updateData);

      reply.send({
        message: 'Material atualizado com sucesso',
        material
      });
    } catch (error) {
      request.log.error('Update material error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao atualizar material'
      });
    }
  }

  // DELETE /api/materials/:id
  async delete(request, reply) {
    try {
      const { id } = request.params;

      if (!validateUUID(id)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'ID inválido'
        });
      }

      const material = await MaterialService.findById(id);
      if (!material) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Material não encontrado'
        });
      }

      // Soft delete - apenas desativa o material
      await MaterialService.deactivate(id);

      reply.send({
        message: 'Material desativado com sucesso'
      });
    } catch (error) {
      request.log.error('Delete material error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao desativar material'
      });
    }
  }

  // GET /api/materials/types
  async getTypes(request, reply) {
    try {
      const types = ['Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales'];
      
      reply.send({
        types: types.map(type => ({
          value: type,
          label: type
        }))
      });
    } catch (error) {
      request.log.error('Get material types error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao buscar tipos de material'
      });
    }
  }

  // GET /api/materials/categories
  async getCategories(request, reply) {
    try {
      const categories = await MaterialService.getCategories();
      
      reply.send({
        categories: categories.map(cat => ({
          value: cat,
          label: cat
        }))
      });
    } catch (error) {
      request.log.error('Get material categories error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro ao buscar categorias'
      });
    }
  }

  // POST /api/materials/bulk-import
  async bulkImport(request, reply) {
    try {
      const { materials } = request.body;

      if (!Array.isArray(materials) || materials.length === 0) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Lista de materiais é obrigatória'
        });
      }

      const result = await MaterialService.bulkImport(materials);

      reply.send({
        message: 'Importação realizada com sucesso',
        result: {
          imported: result.imported,
          errors: result.errors,
          total: materials.length
        }
      });
    } catch (error) {
      request.log.error('Bulk import materials error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro na importação em lote'
      });
    }
  }
}

module.exports = new MaterialController();