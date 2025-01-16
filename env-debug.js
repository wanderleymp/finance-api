const fs = require('fs');
const path = require('path');

console.log('Diretório atual:', process.cwd());
console.log('Caminho absoluto do script:', __dirname);

// Tentar carregar .env manualmente
const envPath = path.resolve(__dirname, '.env');
console.log('Caminho do .env:', envPath);

try {
    // Verificar se o arquivo existe
    if (fs.existsSync(envPath)) {
        console.log('Arquivo .env encontrado');
        const envContents = fs.readFileSync(envPath, 'utf8');
        console.log('Conteúdo do .env:');
        console.log(envContents);
    } else {
        console.log('Arquivo .env NÃO encontrado');
    }
} catch (error) {
    console.error('Erro ao ler .env:', error);
}

// Tentar carregar dotenv explicitamente
require('dotenv').config({ 
    path: envPath,
    debug: true 
});

console.log('Variáveis de ambiente carregadas:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('SYSTEM_DATABASE_URL:', process.env.SYSTEM_DATABASE_URL);
console.log('PORT:', process.env.PORT);
