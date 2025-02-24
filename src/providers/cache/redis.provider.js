const ICacheProvider = require('./cache-provider.interface');
const Redis = require('ioredis');

class RedisCacheProvider extends ICacheProvider {
    constructor(config) {
        super();
        this.client = new Redis(config);

        this.client.on('error', (error) => {
            console.error('Erro na conexão com Redis:', error);
        });

        this.client.on('connect', () => {
            console.log('Conexão com Redis estabelecida com sucesso!');
        });
    }

    async set(key, value, ttl) {
        const serializedValue = JSON.stringify(value);
        if (ttl > 0) {
            await this.client.set(key, serializedValue, 'EX', ttl);
        } else {
            await this.client.set(key, serializedValue);
        }
    }

    async get(key) {
        const value = await this.client.get(key);
        if (!value) return null;
        
        try {
            return JSON.parse(value);
        } catch (error) {
            console.error('Erro ao deserializar valor do cache:', error);
            return null;
        }
    }

    async del(key) {
        await this.client.del(key);
    }

    async clear() {
        await this.client.flushdb();
    }

    async disconnect() {
        await this.client.quit();
    }
}

module.exports = RedisCacheProvider;
