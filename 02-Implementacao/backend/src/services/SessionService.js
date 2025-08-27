const { query } = require('../database/connection');
const { v4: uuidv4 } = require('uuid');

class SessionService {
  async create(userId, refreshToken) {
    const id = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    const result = await query(`
      INSERT INTO sessions (id, user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, userId, refreshToken, expiresAt]);

    return result.rows[0];
  }

  async findByToken(refreshToken) {
    const result = await query(`
      SELECT * FROM sessions 
      WHERE refresh_token = $1 AND expires_at > NOW()
    `, [refreshToken]);

    return result.rows[0] || null;
  }

  async update(sessionId, newRefreshToken) {
    const result = await query(`
      UPDATE sessions 
      SET refresh_token = $1, last_used = NOW()
      WHERE id = $2
      RETURNING *
    `, [newRefreshToken, sessionId]);

    return result.rows[0];
  }

  async deleteByToken(refreshToken) {
    await query(`DELETE FROM sessions WHERE refresh_token = $1`, [refreshToken]);
  }

  async deleteByUserId(userId) {
    await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  }

  async cleanExpired() {
    const result = await query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
    return result.rowCount;
  }
}

module.exports = new SessionService();