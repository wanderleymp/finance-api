require('dotenv').config();
const CacheHelper = require('../src/helpers/cache.helper');
const MemoryCacheProvider = require('../src/providers/cache/memory.provider');
const RedisCacheProvider = require('../src/providers/cache/redis.provider');

// Configuração do Redis para testes
const redisConfig = {
    host: process.env.REDIS_AGILE_HOST || '10.1.0.4',
    port: parseInt(process.env.REDIS_AGILE_PORT || '6380'),
    password: process.env.REDIS_AGILE_PASSWORD,
    db: parseInt(process.env.REDIS_AGILE_DB || '0')
};

async function testarProviderCache(provider, nome) {
    console.log(`\n=== Testando ${nome} ===`);

    try {
        // Teste 1: SET e GET básico
        console.log('\n1. Testando SET e GET básico');
        await provider.set('teste:1', { mensagem: 'Olá Mundo!' });
        const resultado1 = await provider.get('teste:1');
        console.log('Resultado:', resultado1);
        console.assert(resultado1.mensagem === 'Olá Mundo!', 'Valor recuperado não corresponde ao armazenado');

        // Teste 2: TTL
        console.log('\n2. Testando TTL (expire)');
        await provider.set('teste:2', 'valor temporário', 2);
        console.log('Valor inicial:', await provider.get('teste:2'));
        await new Promise(resolve => setTimeout(resolve, 2500));
        const resultado2 = await provider.get('teste:2');
        console.log('Após 2.5 segundos:', resultado2);
        console.assert(resultado2 === null, 'Valor não expirou conforme esperado');

        // Teste 3: DELETE
        console.log('\n3. Testando DELETE');
        await provider.set('teste:3', 'valor para deletar');
        await provider.del('teste:3');
        const resultado3 = await provider.get('teste:3');
        console.log('Após deletar:', resultado3);
        console.assert(resultado3 === null, 'Valor não foi deletado corretamente');

        // Teste 4: CLEAR
        console.log('\n4. Testando CLEAR');
        await provider.set('teste:4a', 'valor 1');
        await provider.set('teste:4b', 'valor 2');
        await provider.clear();
        const resultado4a = await provider.get('teste:4a');
        const resultado4b = await provider.get('teste:4b');
        console.log('Após limpar cache:', { resultado4a, resultado4b });
        console.assert(resultado4a === null && resultado4b === null, 'Cache não foi limpo corretamente');

        // Teste 5: Objetos complexos
        console.log('\n5. Testando objetos complexos');
        const objetoComplexo = {
            id: 1,
            nome: 'Teste',
            data: new Date(),
            array: [1, 2, 3],
            nested: {
                a: 1,
                b: 'dois'
            }
        };
        await provider.set('teste:5', objetoComplexo);
        const resultado5 = await provider.get('teste:5');
        console.log('Objeto recuperado:', resultado5);
        console.assert(JSON.stringify(resultado5) === JSON.stringify(objetoComplexo), 
            'Objeto complexo não foi armazenado/recuperado corretamente');

        console.log(`\n✅ Todos os testes passaram para ${nome}!`);
    } catch (error) {
        console.error(`❌ Erro nos testes de ${nome}:`, error);
        throw error;
    }
}

async function testarCacheHelper() {
    console.log('\n=== Testando CacheHelper ===');

    try {
        // Teste com Memory Cache
        console.log('\n1. Testando CacheHelper com MemoryCache');
        CacheHelper.initialize({ enabled: true, provider: 'memory' });
        const resultadoMemory = await CacheHelper.getOrSet('teste:helper:1', 
            async () => ({ fonte: 'fallback', valor: 'memory' }), 
            5
        );
        console.log('Resultado Memory:', resultadoMemory);

        // Teste com Redis Cache
        console.log('\n2. Testando CacheHelper com Redis');
        CacheHelper.initialize({ 
            enabled: true, 
            provider: 'redis',
            redis: redisConfig
        });
        const resultadoRedis = await CacheHelper.getOrSet('teste:helper:2', 
            async () => ({ fonte: 'fallback', valor: 'redis' }), 
            5
        );
        console.log('Resultado Redis:', resultadoRedis);

        console.log('\n✅ Todos os testes do CacheHelper passaram!');
    } catch (error) {
        console.error('❌ Erro nos testes do CacheHelper:', error);
        throw error;
    }
}

async function executarTestes() {
    console.log('Iniciando testes do sistema de cache...\n');

    try {
        // Testar MemoryCache
        const memoryProvider = new MemoryCacheProvider();
        await testarProviderCache(memoryProvider, 'MemoryCache');

        // Testar RedisCache
        const redisProvider = new RedisCacheProvider(redisConfig);
        await testarProviderCache(redisProvider, 'RedisCache');

        // Testar CacheHelper
        await testarCacheHelper();

        // Desconectar Redis no final
        if (redisProvider.disconnect) {
            await redisProvider.disconnect();
        }

        console.log('\n✅ Todos os testes foram concluídos com sucesso!');
    } catch (error) {
        console.error('\n❌ Erro durante a execução dos testes:', error);
        process.exit(1);
    }
}

// Executar os testes
executarTestes();
