const { Pool } = require('pg');
const config = require('../config');

let pool = null;

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl,
        min: config.database.pool.min,
        max: config.database.pool.max,
        idleTimeoutMillis: config.database.pool.idleTimeoutMillis
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.log('✅ PostgreSQL connected successfully');
      return this.pool;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  async query(text, params) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('🔍 Query executed', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('❌ Query error:', { text, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('✅ Database connection closed');
    }
  }
}

// Singleton instance
const database = new Database();

async function initializeDatabase() {
  pool = await database.connect();
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

module.exports = {
  database,
  initializeDatabase,
  getPool,
  query: (text, params) => database.query(text, params),
  transaction: (callback) => database.transaction(callback)
};