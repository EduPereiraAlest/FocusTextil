require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // Database Configuration (PostgreSQL)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'focus_textil',
    user: process.env.DB_USER || 'focus_user',
    password: process.env.DB_PASSWORD || 'focus_password_2024',
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'focus_jwt_secret_2024_development',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'focus_refresh_secret_2024',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },

  // Security Configuration
  security: {
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8
  },

  // Rate Limiting
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
    skipSuccessfulRequests: false
  },

  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // Couchbase Migration (Legacy System)
  couchbase: {
    host: process.env.COUCHBASE_HOST || 'focustextil.loc.br',
    bucket: process.env.COUCHBASE_BUCKET || 'focus-salesforce',
    username: process.env.COUCHBASE_USER || 'admin',
    password: process.env.COUCHBASE_PASSWORD || '',
    migrationBatchSize: 1000
  },

  // SAP Gateway Integration
  sap: {
    gateway: process.env.SAP_GATEWAY_URL || 'http://sap-gateway.focustextil.loc.br',
    username: process.env.SAP_USER || '',
    password: process.env.SAP_PASSWORD || '',
    timeout: 30000
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/focus-textil.log',
    maxSize: '20m',
    maxFiles: '14d'
  }
};

module.exports = config;