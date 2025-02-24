const ICacheProvider = require('./cache-provider.interface');

class MemoryCacheProvider extends ICacheProvider {
    constructor() {
        super();
        this.cache = new Map();
        this.timeouts = new Map();
    }

    async set(key, value, ttl) {
        // Remove o timeout anterior se existir
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }

        // Armazena o valor
        this.cache.set(key, value);

        // Configura o TTL se fornecido
        if (ttl > 0) {
            const timeout = setTimeout(() => {
                this.cache.delete(key);
                this.timeouts.delete(key);
            }, ttl * 1000);
            this.timeouts.set(key, timeout);
        }
    }

    async get(key) {
        return this.cache.get(key) || null;
    }

    async del(key) {
        // Remove o timeout se existir
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
        this.cache.delete(key);
    }

    async clear() {
        // Limpa todos os timeouts
        for (const timeout of this.timeouts.values()) {
            clearTimeout(timeout);
        }
        this.timeouts.clear();
        this.cache.clear();
    }
}

module.exports = MemoryCacheProvider;
