const Redis = require('ioredis');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('Iniciando diagnóstico de conexão Redis...');

// Configurações de conexão
const redisConfig = {
    host: 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
};

console.log('Configurações de conexão:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
    passwordLength: redisConfig.password ? redisConfig.password.length : 'NO PASSWORD'
});

// Criar cliente Redis
const redis = new Redis(redisConfig);

// Eventos de conexão
redis.on('error', (err) => {
    console.error('ERRO DETALHADO DE CONEXÃO:', {
        message: err.message,
        name: err.name,
        code: err.code,
        stack: err.stack
    });
    process.exit(1);
});

redis.on('connect', () => {
    console.log('Conexão Redis estabelecida com sucesso!');
});

redis.on('ready', () => {
    console.log('Redis está pronto para uso.');
    
    // Tentar um comando simples
    redis.ping((err, result) => {
        if (err) {
            console.error('Erro no ping:', err);
            process.exit(1);
        }
        console.log('Ping result:', result);
        redis.quit();
        process.exit(0);
    });
});
