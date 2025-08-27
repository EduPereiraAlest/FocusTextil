const { query, transaction } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class MaterialService {
  async create(materialData) {
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
    } = materialData;

    const id = uuidv4();

    const result = await query(`
      INSERT INTO materials (
        id, code, name, description, type, category, price, 
        stock_quantity, unit, composition, color, width, weight
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      id, code, name, description, type, category, price, 
      stockQuantity, unit, composition, color, width, weight
    ]);

    return result.rows[0];
  }

  async findById(id) {
    const result = await query(`
      SELECT * FROM materials WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  async findByCode(code) {
    const result = await query(`
      SELECT * FROM materials WHERE code = $1
    `, [code]);

    return result.rows[0] || null;
  }

  async list(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (filters.type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.category) {
      whereClause += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.active !== undefined) {
      whereClause += ` AND active = $${paramIndex}`;
      params.push(filters.active);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Total de registros
    const countResult = await query(`
      SELECT COUNT(*) as total FROM materials ${whereClause}
    `, params);

    // Materiais com paginação
    const materialsResult = await query(`
      SELECT 
        id, code, name, description, type, category, price,
        stock_quantity, unit, composition, color, width, weight,
        active, created_at, updated_at
      FROM materials 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return {
      materials: materialsResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  async update(id, updateData) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // Campos que podem ser atualizados
    const allowedFields = [
      'code', 'name', 'description', 'type', 'category', 'price',
      'stock_quantity', 'unit', 'composition', 'color', 'width', 'weight', 'active'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        const dbField = field === 'stockQuantity' ? 'stock_quantity' : field;
        fields.push(`${dbField} = $${paramIndex}`);
        params.push(updateData[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    fields.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query(`
      UPDATE materials 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    return result.rows[0];
  }

  async deactivate(id) {
    const result = await query(`
      UPDATE materials 
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  async activate(id) {
    const result = await query(`
      UPDATE materials 
      SET active = true, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  async updateStock(id, quantity, operation = 'add') {
    const operator = operation === 'add' ? '+' : '-';
    
    const result = await query(`
      UPDATE materials 
      SET 
        stock_quantity = stock_quantity ${operator} $1,
        updated_at = NOW()
      WHERE id = $2 AND active = true
      RETURNING id, code, name, stock_quantity
    `, [Math.abs(quantity), id]);

    return result.rows[0];
  }

  async getCategories() {
    const result = await query(`
      SELECT DISTINCT category 
      FROM materials 
      WHERE category IS NOT NULL AND active = true
      ORDER BY category
    `);

    return result.rows.map(row => row.category);
  }

  async getMaterialStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true) as active,
        COUNT(*) FILTER (WHERE active = false) as inactive,
        COUNT(*) FILTER (WHERE type = 'Geral') as geral,
        COUNT(*) FILTER (WHERE type = 'Pré Lançamento') as pre_lancamento,
        COUNT(*) FILTER (WHERE type = 'Outlet') as outlet,
        COUNT(*) FILTER (WHERE type = 'Promo') as promo,
        COUNT(*) FILTER (WHERE type = 'Sales') as sales,
        AVG(price) FILTER (WHERE price IS NOT NULL) as avg_price,
        SUM(stock_quantity) as total_stock
      FROM materials
    `);

    return result.rows[0];
  }

  async bulkImport(materials) {
    const results = {
      imported: 0,
      errors: []
    };

    await transaction(async (client) => {
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        
        try {
          // Validações básicas
          if (!material.code || !material.name) {
            results.errors.push({
              line: i + 1,
              error: 'Código e nome são obrigatórios'
            });
            continue;
          }

          // Verificar se código já existe
          const existingResult = await client.query(
            'SELECT id FROM materials WHERE code = $1',
            [material.code]
          );

          if (existingResult.rows.length > 0) {
            results.errors.push({
              line: i + 1,
              code: material.code,
              error: 'Código já existe'
            });
            continue;
          }

          // Inserir material
          const id = uuidv4();
          await client.query(`
            INSERT INTO materials (
              id, code, name, description, type, category, price,
              stock_quantity, unit, composition, color, width, weight
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            id,
            material.code,
            material.name,
            material.description || null,
            material.type || 'Geral',
            material.category || null,
            material.price || null,
            material.stockQuantity || 0,
            material.unit || 'metros',
            material.composition || null,
            material.color || null,
            material.width || null,
            material.weight || null
          ]);

          results.imported++;
        } catch (error) {
          results.errors.push({
            line: i + 1,
            code: material.code,
            error: error.message
          });
        }
      }
    });

    return results;
  }

  async searchMaterials(searchTerm, limit = 10) {
    const result = await query(`
      SELECT id, code, name, type, category, price, stock_quantity, unit
      FROM materials 
      WHERE active = true 
        AND (
          name ILIKE $1 OR 
          code ILIKE $1 OR 
          description ILIKE $1 OR
          category ILIKE $1 OR
          composition ILIKE $1
        )
      ORDER BY 
        CASE 
          WHEN name ILIKE $1 THEN 1
          WHEN code ILIKE $1 THEN 2
          ELSE 3
        END,
        name
      LIMIT $2
    `, [`%${searchTerm}%`, limit]);

    return result.rows;
  }

  async getLowStockMaterials(threshold = 10) {
    const result = await query(`
      SELECT id, code, name, stock_quantity, unit
      FROM materials 
      WHERE active = true AND stock_quantity <= $1
      ORDER BY stock_quantity ASC, name
    `, [threshold]);

    return result.rows;
  }
}

module.exports = new MaterialService();