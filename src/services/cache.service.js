const redis = require('../config/redis');
const { logger } = require('../middlewares/logger');

class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hora em segundos
    }

    /**
     * Gera uma chave única para o cache
     */
    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});

        return `${prefix}:${JSON.stringify(sortedParams)}`;
    }

    /**
     * Busca um valor no cache
     */
    async get(key) {
        try {
            const value = await redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error('Erro ao buscar cache', { error });
            return null;
        }
    }

    /**
     * Define um valor no cache
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            logger.error('Erro ao definir cache', { error });
        }
    }

    /**
     * Remove um valor do cache
     */
    async delete(key) {
        try {
            await redis.del(key);
        } catch (error) {
            logger.error('Erro ao deletar cache', { error });
        }
    }

    /**
     * Busca um valor no cache ou executa uma função
     */
    async getOrSet(key, fn, ttl = this.defaultTTL) {
        try {
            const cached = await this.get(key);
            if (cached) {
                return cached;
            }

            const value = await fn();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            logger.error('Erro ao buscar/definir cache', { error });
            return await fn();
        }
    }
}

module.exports = new CacheService();
