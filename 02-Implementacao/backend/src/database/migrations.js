const { query } = require('./connection');

const migrations = [
  // 001 - Users table
  {
    id: '001_create_users',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
        active BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
    `,
    down: `
      DROP TABLE IF EXISTS users;
    `
  },

  // 002 - Materials table (específico para têxtil)
  {
    id: '002_create_materials',
    up: `
      CREATE TABLE IF NOT EXISTS materials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(100) DEFAULT 'Geral' CHECK (type IN ('Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales')),
        category VARCHAR(100),
        price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'metros',
        composition TEXT,
        color VARCHAR(100),
        width DECIMAL(8,2),
        weight DECIMAL(8,2),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_materials_code ON materials(code);
      CREATE INDEX idx_materials_type ON materials(type);
      CREATE INDEX idx_materials_category ON materials(category);
    `,
    down: `
      DROP TABLE IF EXISTS materials;
    `
  },

  // 003 - Orders table
  {
    id: '003_create_orders',
    up: `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_created_at ON orders(created_at);
    `,
    down: `
      DROP TABLE IF EXISTS orders;
    `
  },

  // 004 - Order items table
  {
    id: '004_create_order_items',
    up: `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
        quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX idx_order_items_material_id ON order_items(material_id);
    `,
    down: `
      DROP TABLE IF EXISTS order_items;
    `
  },

  // 005 - Migration log table
  {
    id: '005_create_migration_log',
    up: `
      CREATE TABLE IF NOT EXISTS migration_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source VARCHAR(50) NOT NULL, -- 'couchbase', 'sap_gateway'
        entity_type VARCHAR(100) NOT NULL, -- 'users', 'materials', 'orders'
        entity_id VARCHAR(255) NOT NULL,
        operation VARCHAR(50) NOT NULL, -- 'migrated', 'updated', 'error'
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_migration_log_source ON migration_log(source);
      CREATE INDEX idx_migration_log_entity_type ON migration_log(entity_type);
      CREATE INDEX idx_migration_log_operation ON migration_log(operation);
    `,
    down: `
      DROP TABLE IF EXISTS migration_log;
    `
  },

  // 006 - Sessions table (para refresh tokens)
  {
    id: '006_create_sessions',
    up: `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        refresh_token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
      CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
    `,
    down: `
      DROP TABLE IF EXISTS sessions;
    `
  }
];

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Create migrations table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get executed migrations
    const executedResult = await query('SELECT id FROM migrations ORDER BY executed_at');
    const executedMigrations = executedResult.rows.map(row => row.id);

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrations.includes(migration.id)) {
        console.log(`📄 Running migration: ${migration.id}`);
        
        await query(migration.up);
        await query('INSERT INTO migrations (id) VALUES ($1)', [migration.id]);
        
        console.log(`✅ Migration ${migration.id} completed`);
      } else {
        console.log(`⏭️ Migration ${migration.id} already executed`);
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

module.exports = {
  migrations,
  runMigrations
};