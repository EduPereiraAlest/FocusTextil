const { runMigrations } = require('./src/database/migrations');
const { initializeDatabase } = require('./src/database/connection');

async function migrate() {
  try {
    console.log('🔄 Iniciando migrações do banco de dados...');
    
    await initializeDatabase();
    await runMigrations();
    
    console.log('✅ Migrações concluídas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
  }
}

migrate();