const cacheService = require('../cache.service');
const redis = require('../../config/redis');

jest.mock('../../config/redis');

describe('CacheService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateKey', () => {
        it('deve gerar chave com prefixo e parâmetros ordenados', () => {
            const key = cacheService.generateKey('test', {
                b: 2,
                a: 1,
                c: 3
            });

            expect(key).toBe('test:{"a":1,"b":2,"c":3}');
        });

        it('deve gerar chave apenas com prefixo quando não houver parâmetros', () => {
            const key = cacheService.generateKey('test');
            expect(key).toBe('test:{}');
        });
    });

    describe('get', () => {
        it('deve retornar valor do cache quando existir', async () => {
            const mockValue = { test: 'value' };
            redis.get.mockResolvedValue(JSON.stringify(mockValue));

            const result = await cacheService.get('test:key');
            expect(result).toEqual(mockValue);
        });

        it('deve retornar null quando valor não existir', async () => {
            redis.get.mockResolvedValue(null);

            const result = await cacheService.get('test:key');
            expect(result).toBeNull();
        });

        it('deve retornar null em caso de erro', async () => {
            redis.get.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.get('test:key');
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('deve armazenar valor no cache com TTL padrão', async () => {
            const value = { test: 'value' };
            await cacheService.set('test:key', value);

            expect(redis.set).toHaveBeenCalledWith(
                'test:key',
                JSON.stringify(value),
                'EX',
                3600
            );
        });

        it('deve armazenar valor no cache com TTL personalizado', async () => {
            const value = { test: 'value' };
            await cacheService.set('test:key', value, 60);

            expect(redis.set).toHaveBeenCalledWith(
                'test:key',
                JSON.stringify(value),
                'EX',
                60
            );
        });

        it('deve logar erro em caso de falha', async () => {
            redis.set.mockRejectedValue(new Error('Redis error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await cacheService.set('test:key', 'value');
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deve remover valor do cache', async () => {
            await cacheService.delete('test:key');
            expect(redis.del).toHaveBeenCalledWith('test:key');
        });

        it('deve logar erro em caso de falha', async () => {
            redis.del.mockRejectedValue(new Error('Redis error'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            await cacheService.delete('test:key');
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('deletePattern', () => {
        it('deve remover valores do cache por padrão', async () => {
            redis.keys.mockResolvedValue(['key1', 'key2']);

            await cacheService.deletePattern('test:*');

            expect(redis.keys).toHaveBeenCalledWith('test:*');
            expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
        });

        it('não deve chamar del se não encontrar chaves', async () => {
            redis.keys.mockResolvedValue([]);

            await cacheService.deletePattern('test:*');

            expect(redis.keys).toHaveBeenCalledWith('test:*');
            expect(redis.del).not.toHaveBeenCalled();
        });
    });

    describe('getOrSet', () => {
        it('deve retornar valor do cache quando existir', async () => {
            const mockValue = { test: 'value' };
            redis.get.mockResolvedValue(JSON.stringify(mockValue));

            const fn = jest.fn();
            const result = await cacheService.getOrSet('test:key', fn);

            expect(result).toEqual(mockValue);
            expect(fn).not.toHaveBeenCalled();
        });

        it('deve executar função e armazenar resultado quando cache não existir', async () => {
            const mockValue = { test: 'value' };
            redis.get.mockResolvedValue(null);
            const fn = jest.fn().mockResolvedValue(mockValue);

            const result = await cacheService.getOrSet('test:key', fn);

            expect(result).toEqual(mockValue);
            expect(fn).toHaveBeenCalled();
            expect(redis.set).toHaveBeenCalledWith(
                'test:key',
                JSON.stringify(mockValue),
                'EX',
                3600
            );
        });

        it('deve executar função diretamente em caso de erro no cache', async () => {
            const mockValue = { test: 'value' };
            redis.get.mockRejectedValue(new Error('Redis error'));
            const fn = jest.fn().mockResolvedValue(mockValue);

            const result = await cacheService.getOrSet('test:key', fn);

            expect(result).toEqual(mockValue);
            expect(fn).toHaveBeenCalled();
        });
    });
});
