const redis = require('redis');
const config = require('../config');

let client = null;

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db
      });

      this.client.on('error', (err) => {
        console.error('Redis connection error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async get(key) {
    return await this.client.get(key);
  }

  async set(key, value, expiry = null) {
    if (expiry) {
      return await this.client.setEx(key, expiry, value);
    }
    return await this.client.set(key, value);
  }

  async del(key) {
    return await this.client.del(key);
  }

  async exists(key) {
    return await this.client.exists(key);
  }
}

const redisClient = new RedisClient();

async function initializeRedis() {
  client = await redisClient.connect();
  return client;
}

module.exports = {
  redisClient,
  initializeRedis,
  getRedisClient: () => client
};