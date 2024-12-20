const Redis = require('ioredis');
const { logger } = require('../middlewares/logger');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3
};

const redis = new Redis(redisConfig);

redis.on('error', (error) => {
    logger.error('Erro na conexão com Redis', {
        error: error.message,
        stack: error.stack
    });
});

redis.on('connect', () => {
    logger.info('Conectado ao Redis com sucesso');
});

module.exports = redis;
