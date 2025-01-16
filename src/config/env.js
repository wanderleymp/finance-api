const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Esquema de validação de variáveis de ambiente
const ENV_SCHEMA = {
    required: [
        'SYSTEM_DATABASE_URL', 
        'JWT_SECRET', 
        'PORT'
    ],
    optional: [
        'NODE_ENV', 
        'LOG_LEVEL', 
        'DATABASE_URL',
        'DEV_DATABASE_URL',
        'JWT_EXPIRATION',
        'REFRESH_TOKEN_EXPIRATION'
    ],
    defaults: {
        NODE_ENV: 'development',
        PORT: 3000,
        LOG_LEVEL: 'info',
        JWT_EXPIRATION: '4h',
        REFRESH_TOKEN_EXPIRATION: '7d'
    },
    validators: {
        PORT: (value) => {
            const port = parseInt(value, 10);
            return !isNaN(port) && port > 0 && port < 65536;
        },
        SYSTEM_DATABASE_URL: (value) => {
            // Validar formato de URL de banco de dados PostgreSQL
            return /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+(\?ssl=(true|false))?$/.test(value);
        },
        JWT_SECRET: (value) => {
            // Garantir que a chave JWT tenha um comprimento mínimo
            return value && value.length >= 16;
        },
        JWT_EXPIRATION: (value) => {
            // Validar formato de expiração (ex: 4h, 30m, 1d)
            return /^\d+[hdm]$/.test(value);
        },
        LOG_LEVEL: (value) => {
            const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
            return validLevels.includes(value);
        }
    }
};

// Função para validar variáveis de ambiente
function validateEnvironment(env) {
    const errors = [];
    const warnings = [];

    // Validar variáveis obrigatórias
    ENV_SCHEMA.required.forEach(varName => {
        if (!env[varName]) {
            errors.push(`Variável de ambiente obrigatória não definida: ${varName}`);
        }
    });

    // Executar validadores específicos
    Object.entries(ENV_SCHEMA.validators).forEach(([varName, validator]) => {
        if (env[varName] && !validator(env[varName])) {
            errors.push(`Valor inválido para ${varName}: ${env[varName]}`);
        }
    });

    // Verificar variáveis não documentadas
    const documentedVars = [
        ...ENV_SCHEMA.required, 
        ...ENV_SCHEMA.optional,
        ...Object.keys(ENV_SCHEMA.validators)
    ];

    Object.keys(env).forEach(key => {
        const ignoredPrefixes = [
            'NODE_', 'npm_', 'VSCODE_', 'SSH_', 'XDG_', 
            'SHELL', 'HOME', 'USER', 'LANG', 'PATH'
        ];
        
        const isIgnored = ignoredPrefixes.some(prefix => key.startsWith(prefix));
        
        if (!documentedVars.includes(key) && !isIgnored) {
            warnings.push(`Variável não documentada encontrada: ${key}`);
        }
    });

    return { errors, warnings };
}

// Função para carregar variáveis de ambiente de forma segura
function loadEnvironmentVariables() {
    // Definir ordem de prioridade dos arquivos .env
    const envFiles = [
        path.resolve(process.cwd(), '.env'),           // Arquivo .env principal (mais alta prioridade)
        path.resolve(process.cwd(), '.env.local'),     // Configurações locais
        path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`), // Ambiente específico
        path.resolve(process.cwd(), '.env.example')    // Exemplo (baixa prioridade)
    ];

    // Aplicar configurações padrão
    Object.entries(ENV_SCHEMA.defaults).forEach(([key, value]) => {
        if (!process.env[key]) {
            process.env[key] = value;
        }
    });

    // Carregar arquivos .env em ordem
    envFiles.forEach(envPath => {
        try {
            if (fs.existsSync(envPath)) {
                const result = dotenv.config({ 
                    path: envPath, 
                    override: false,  // Não sobrescrever variáveis já definidas
                    debug: process.env.NODE_ENV === 'development' 
                });

                if (result.error && result.error.code !== 'ENOENT') {
                    console.warn(`Erro ao carregar ${envPath}:`, result.error);
                }
            }
        } catch (error) {
            console.warn(`Não foi possível carregar ${envPath}:`, error);
        }
    });

    // Validar variáveis de ambiente
    const { errors, warnings } = validateEnvironment(process.env);

    // Tratamento de avisos
    if (warnings.length > 0) {
        console.warn('Avisos de configuração de ambiente:');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // Tratamento de erros de validação
    if (errors.length > 0) {
        console.error('Erros de configuração de ambiente:');
        errors.forEach(error => console.error(`  - ${error}`));

        // Em produção, lançar erro
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Configuração de ambiente inválida');
        }
    }

    // Log de variáveis carregadas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        console.log('Variáveis de ambiente carregadas:');
        [...ENV_SCHEMA.required, ...ENV_SCHEMA.optional].forEach(varName => {
            const value = process.env[varName];
            console.log(`  ${varName}: ${value ? (value.includes(':') ? value.replace(/:[^:]+@/g, ':****@') : value) : 'NÃO DEFINIDA'}`);
        });
    }

    return process.env;
}

// Carregar variáveis de ambiente imediatamente
const loadedEnv = loadEnvironmentVariables();

module.exports = {
    loadEnvironmentVariables,
    validateEnvironment,
    ENV_SCHEMA,
    env: loadedEnv
};
