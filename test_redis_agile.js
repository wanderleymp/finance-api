const Redis = require('ioredis');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('Iniciando teste de conexão com Redis Agile...');

const redisConfig = {
    host: '10.1.0.4',
    port: 6380,
    password: process.env.REDIS_AGILE_PASSWORD, // Usando a variável de ambiente
    db: 0,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
};

console.log('Configurações de conexão:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    passwordLength: redisConfig.password ? redisConfig.password.length : 'NO PASSWORD'
});

console.log('Senha do Redis:', process.env.REDIS_AGILE_PASSWORD);

const redis = new Redis(redisConfig);

redis.on('error', (err) => {
    console.error('ERRO DE CONEXÃO REDIS:', {
        message: err.message,
        name: err.name,
        code: err.code,
        stack: err.stack
    });
    process.exit(1);
});

redis.on('connect', () => {
    console.log('Conexão com Redis estabelecida com sucesso!');
});

redis.on('ready', () => {
    console.log('Redis está pronto para uso.');
    
    // Testar operações básicas
    Promise.all([
        redis.set('test:key', 'test:value'),
        redis.get('test:key')
    ]).then(([setResult, getResult]) => {
        console.log('Teste de operações:', {
            set: setResult,
            get: getResult
        });
        
        // Limpar chave de teste
        return redis.del('test:key');
    }).then(() => {
        console.log('Teste concluído com sucesso!');
        redis.quit();
        process.exit(0);
    }).catch((error) => {
        console.error('Erro nos testes:', error);
        redis.quit();
        process.exit(1);
    });
});
