const Redis = require('ioredis');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('Configurações de conexão:');
console.log('Host:', process.env.REDIS_HOST);
console.log('Port:', process.env.REDIS_PORT);
console.log('Password:', process.env.REDIS_PASSWORD ? '[REDACTED]' : 'NOT SET');
console.log('DB:', process.env.REDIS_DB);

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
});

redis.on('error', (err) => {
    console.error('Redis Error:', err);
    console.error('Detalhes completos do erro:', JSON.stringify(err, null, 2));
    process.exit(1);
});

redis.on('connect', () => {
    console.log('Redis conectado com sucesso');
});

redis.ping((err, result) => {
    if (err) {
        console.error('Erro no ping:', err);
        process.exit(1);
    } else {
        console.log('Resultado do ping:', result);
        redis.quit();
        process.exit(0);
    }
});
