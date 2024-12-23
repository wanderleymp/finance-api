const { logger } = require('../middlewares/logger');

class MockCacheService {
    constructor() {
        logger.info('Usando MockCacheService');
        this.cache = new Map();
    }

    generateKey(prefix, params = {}) {
        return `${prefix}:${JSON.stringify(params)}`;
    }

    async get(key) {
        return null;
    }

    async set(key, value, ttl) {
        return true;
    }

    async del(pattern) {
        return true;
    }
}

module.exports = new MockCacheService();
