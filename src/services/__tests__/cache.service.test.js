const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
};

jest.mock('../../config/redis', () => mockRedis);

const CacheService = require('../cache.service');

describe('CacheService', () => {
    let cacheService;
    let consoleSpy;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        cacheService = new CacheService('test');
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('generateKey', () => {
        it('deve gerar chave com prefixo e parâmetros ordenados', () => {
            const key = cacheService.generateKey('test', { b: 2, a: 1 });
            expect(key).toBe('test:a=1:b=2');
        });

        it('deve gerar chave apenas com prefixo quando não houver parâmetros', () => {
            const key = cacheService.generateKey('test');
            expect(key).toBe('test');
        });
    });

    describe('get', () => {
        it('deve retornar valor do cache quando existir', async () => {
            mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'test' }));

            const result = await cacheService.get('test:key');
            expect(result).toEqual({ data: 'test' });
        });

        it('deve retornar null quando valor não existir', async () => {
            mockRedis.get.mockResolvedValue(null);

            const result = await cacheService.get('test:key');
            expect(result).toBeNull();
        });

        it('deve retornar null em caso de erro', async () => {
            mockRedis.get.mockRejectedValue(new Error('Redis error'));

            const result = await cacheService.get('test:key');
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('set', () => {
        it('deve armazenar valor no cache com TTL padrão', async () => {
            mockRedis.set.mockResolvedValue('OK');

            await cacheService.set('test:key', 'value');
            expect(mockRedis.set).toHaveBeenCalledWith('test:key', JSON.stringify('value'), 'EX', 3600);
        });

        it('deve armazenar valor no cache com TTL personalizado', async () => {
            mockRedis.set.mockResolvedValue('OK');

            await cacheService.set('test:key', 'value', 60);
            expect(mockRedis.set).toHaveBeenCalledWith('test:key', JSON.stringify('value'), 'EX', 60);
        });

        it('deve logar erro em caso de falha', async () => {
            mockRedis.set.mockRejectedValue(new Error('Redis error'));

            await cacheService.set('test:key', 'value');
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('deve remover valor do cache', async () => {
            mockRedis.del.mockResolvedValue(1);

            await cacheService.delete('test:key');
            expect(mockRedis.del).toHaveBeenCalledWith('test:key');
        });

        it('deve logar erro em caso de falha', async () => {
            mockRedis.del.mockRejectedValue(new Error('Redis error'));

            await cacheService.delete('test:key');
            expect(consoleSpy).toHaveBeenCalled();
        });
    });

    describe('deletePattern', () => {
        it('deve remover valores do cache por padrão', async () => {
            mockRedis.keys.mockResolvedValue(['key1', 'key2']);
            mockRedis.del.mockResolvedValue(2);

            await cacheService.deletePattern('test:*');
            expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
            expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2');
        });

        it('não deve chamar del se não encontrar chaves', async () => {
            mockRedis.keys.mockResolvedValue([]);

            await cacheService.deletePattern('test:*');
            expect(mockRedis.keys).toHaveBeenCalledWith('test:*');
            expect(mockRedis.del).not.toHaveBeenCalled();
        });
    });

    describe('getOrSet', () => {
        it('deve retornar valor do cache quando existir', async () => {
            mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'cached' }));
            const fn = jest.fn();

            const result = await cacheService.getOrSet('test:key', fn);
            expect(result).toEqual({ data: 'cached' });
            expect(fn).not.toHaveBeenCalled();
        });

        it('deve executar função e armazenar resultado quando cache não existir', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.set.mockResolvedValue('OK');
            const fn = jest.fn().mockResolvedValue({ data: 'new' });

            const result = await cacheService.getOrSet('test:key', fn);
            expect(result).toEqual({ data: 'new' });
            expect(fn).toHaveBeenCalled();
            expect(mockRedis.set).toHaveBeenCalled();
        });

        it('deve executar função diretamente em caso de erro no cache', async () => {
            mockRedis.get.mockRejectedValue(new Error('Redis error'));
            const fn = jest.fn().mockResolvedValue({ data: 'new' });

            const result = await cacheService.getOrSet('test:key', fn);
            expect(result).toEqual({ data: 'new' });
            expect(fn).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
