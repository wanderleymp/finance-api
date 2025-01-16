const fs = require('fs');
const path = require('path');

// Função para buscar arquivos recursivamente
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Ignorar pastas de node_modules e .git
            if (file !== 'node_modules' && file !== '.git') {
                findFiles(filePath, fileList);
            }
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Função para analisar uso de variáveis de ambiente
function analyzeEnvUsage(files) {
    const envVariables = {};
    const commonEnvVars = [
        'NODE_ENV', 
        'DATABASE_URL', 
        'SYSTEM_DATABASE_URL', 
        'PORT', 
        'JWT_SECRET', 
        'JWT_EXPIRATION'
    ];

    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            commonEnvVars.forEach(varName => {
                // Regex para encontrar uso de process.env
                const regex = new RegExp(`process\\.env\\.${varName}`, 'g');
                const matches = content.match(regex);
                
                if (matches) {
                    if (!envVariables[varName]) {
                        envVariables[varName] = [];
                    }
                    envVariables[varName].push({
                        file: file,
                        count: matches.length
                    });
                }
            });
        } catch (error) {
            console.error(`Erro ao processar arquivo ${file}:`, error);
        }
    });

    return envVariables;
}

// Buscar todos os arquivos
const projectRoot = '/root/finance-api';
const allFiles = findFiles(projectRoot);

// Analisar uso de variáveis de ambiente
const envUsage = analyzeEnvUsage(allFiles);

console.log('Uso de variáveis de ambiente no projeto:');
Object.entries(envUsage).forEach(([varName, usages]) => {
    console.log(`\n${varName}:`);
    usages.forEach(usage => {
        console.log(`  - ${usage.file} (${usage.count} ocorrências)`);
    });
});

// Verificar configuração de dotenv nos arquivos
function findDotenvConfig(files) {
    const dotenvConfigs = [];

    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            // Regex para encontrar configurações do dotenv
            const regex = /dotenv\.config\s*\(/g;
            const matches = content.match(regex);
            
            if (matches) {
                dotenvConfigs.push({
                    file: file,
                    count: matches.length
                });
            }
        } catch (error) {
            console.error(`Erro ao processar arquivo ${file}:`, error);
        }
    });

    return dotenvConfigs;
}

console.log('\n\nConfigurações de dotenv encontradas:');
const dotenvConfigs = findDotenvConfig(allFiles);
dotenvConfigs.forEach(config => {
    console.log(`  - ${config.file} (${config.count} ocorrências)`);
});
