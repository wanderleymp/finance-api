const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Função para listar todos os arquivos .env
function findEnvFiles(startPath) {
    const results = [];

    function findFiles(currentPath) {
        const files = fs.readdirSync(currentPath);
        
        files.forEach(file => {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                findFiles(filePath);
            } else if (file === '.env' || file.startsWith('.env.')) {
                results.push(filePath);
            }
        });
    }

    findFiles(startPath);
    return results;
}

// Encontrar arquivos .env
const envFiles = findEnvFiles('/root/finance-api');
console.log('Arquivos .env encontrados:');
envFiles.forEach(file => console.log(file));

// Função para carregar e exibir variáveis de um arquivo .env
function loadAndDisplayEnv(envPath) {
    console.log(`\nCarregando arquivo: ${envPath}`);
    
    try {
        // Ler conteúdo do arquivo
        const fileContents = fs.readFileSync(envPath, 'utf8');
        console.log('Conteúdo do arquivo:');
        console.log(fileContents);

        // Carregar variáveis
        const result = dotenv.config({ 
            path: envPath,
            debug: true 
        });

        if (result.error) {
            console.error('Erro ao carregar .env:', result.error);
        }
    } catch (error) {
        console.error(`Erro ao processar ${envPath}:`, error);
    }
}

// Carregar todos os arquivos .env encontrados
envFiles.forEach(loadAndDisplayEnv);

// Exibir todas as variáveis de ambiente
console.log('\nVariáveis de ambiente carregadas:');
Object.keys(process.env).forEach(key => {
    // Filtrar variáveis relevantes
    if (key.includes('DATABASE') || 
        key.includes('PORT') || 
        key.includes('NODE_ENV') || 
        key.includes('URL')) {
        console.log(`${key}: ${process.env[key]}`);
    }
});

// Verificar caminho de execução e módulos
console.log('\nInformações de execução:');
console.log('Diretório atual:', process.cwd());
console.log('Diretório do script:', __dirname);
console.log('Caminho do Node:', process.execPath);
console.log('Versão do Node:', process.version);

// Verificar módulos instalados
try {
    const packageJson = require('/root/finance-api/package.json');
    console.log('\nDependências instaladas:');
    console.log('dotenv:', packageJson.dependencies.dotenv || 'Não encontrado');
    console.log('pg:', packageJson.dependencies.pg || 'Não encontrado');
} catch (error) {
    console.error('Erro ao ler package.json:', error);
}
