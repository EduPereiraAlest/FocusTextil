const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class UserService {
  async create(userData) {
    const { name, email, passwordHash, role = 'user' } = userData;
    const id = uuidv4();

    const result = await query(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, active, created_at
    `, [id, name, email, passwordHash, role]);

    return result.rows[0];
  }

  async findById(id) {
    const result = await query(`
      SELECT id, name, email, role, active, last_login, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(`
      SELECT id, name, email, password_hash, role, active, last_login, created_at
      FROM users 
      WHERE email = $1
    `, [email]);

    return result.rows[0] || null;
  }

  async list(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (filters.role) {
      whereClause += ` AND role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.active !== undefined) {
      whereClause += ` AND active = $${paramIndex}`;
      params.push(filters.active);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Total de registros
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, params);

    // Usuários com paginação
    const usersResult = await query(`
      SELECT id, name, email, role, active, last_login, created_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset]);

    return {
      users: usersResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  async update(id, updateData) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    // Campos que podem ser atualizados
    const allowedFields = ['name', 'email', 'role', 'active'];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
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
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, role, active, updated_at
    `, params);

    return result.rows[0];
  }

  async updateLastLogin(id) {
    await query(`
      UPDATE users 
      SET last_login = NOW()
      WHERE id = $1
    `, [id]);
  }

  async updatePassword(id, passwordHash) {
    await query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [passwordHash, id]);
  }

  async deactivate(id) {
    const result = await query(`
      UPDATE users 
      SET active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, active
    `, [id]);

    return result.rows[0];
  }

  async activate(id) {
    const result = await query(`
      UPDATE users 
      SET active = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, active
    `, [id]);

    return result.rows[0];
  }

  async delete(id) {
    // Hard delete - use com cautela
    await query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  async getUserStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true) as active,
        COUNT(*) FILTER (WHERE active = false) as inactive,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'user') as regular_users
      FROM users
    `);

    return result.rows[0];
  }

  async getRecentUsers(limit = 10) {
    const result = await query(`
      SELECT id, name, email, role, created_at
      FROM users 
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}

module.exports = new UserService();