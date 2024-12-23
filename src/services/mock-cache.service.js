const { logger } = require('../middlewares/logger');

class MockCacheService {
    constructor() {
        this.cache = new Map();
        logger.info('Usando MockCacheService');
    }

    generateKey(prefix, params = {}) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});

        return `${prefix}:${JSON.stringify(sortedParams)}`;
    }

    async get(key) {
        return this.cache.get(key);
    }

    async set(key, value, ttl = 300) {
        this.cache.set(key, value);
        
        // Simula TTL
        setTimeout(() => {
            this.cache.delete(key);
        }, ttl * 1000);

        return value;
    }

    async getOrSet(key, callback, ttl = 300) {
        const cached = await this.get(key);
        if (cached) {
            return cached;
        }

        const value = await callback();
        await this.set(key, value, ttl);
        return value;
    }

    async del(key) {
        return this.cache.delete(key);
    }

    async clear() {
        return this.cache.clear();
    }

    async keys(pattern) {
        // No mock service, just return an empty array since we don't need pattern matching
        return [];
    }

    async deletePattern(pattern) {
        // No-op in mock service
        return true;
    }
}

module.exports = new MockCacheService();
