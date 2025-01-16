const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Regras de validação expandidas
const VALIDATION_RULES = {
    // Variáveis obrigatórias
    required: [
        'SYSTEM_DATABASE_URL', 
        'JWT_SECRET', 
        'PORT'
    ],

    // Variáveis opcionais com validação
    optional: {
        'DEV_DATABASE_URL': {
            validator: (value) => /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/.test(value),
            errorMsg: 'Deve ser uma URL PostgreSQL válida'
        },
        'JWT_EXPIRATION': {
            validator: (value) => /^\d+[hdm]$/.test(value),
            errorMsg: 'Deve estar no formato de duração (ex: 4h, 30m, 1d)'
        },
        'PORT': {
            validator: (value) => {
                const port = parseInt(value, 10);
                return !isNaN(port) && port > 0 && port < 65536;
            },
            errorMsg: 'Deve ser um número de porta válido entre 1 e 65535'
        },
        'NODE_ENV': {
            validator: (value) => ['development', 'production', 'test', undefined].includes(value),
            errorMsg: 'Deve ser development, production ou test'
        }
    },

    // Validadores específicos
    validators: {
        'SYSTEM_DATABASE_URL': (value) => /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/.test(value),
        'JWT_SECRET': (value) => value && value.length >= 16,
        'LOG_LEVEL': (value) => ['error', 'warn', 'info', 'debug', 'trace', undefined].includes(value),
        
        // Validadores para integrações específicas
        'MICROSOFT_CLIENT_ID': (value) => /^[0-9a-f-]{36}$/i.test(value),
        'MICROSOFT_TENANT_ID': (value) => /^[0-9a-f-]{36}$/i.test(value)
    },

    // Valores padrão
    defaults: {
        'NODE_ENV': 'development',
        'PORT': 3000,
        'LOG_LEVEL': 'info',
        'DISABLE_MIGRATIONS': 'false',
        'ENABLE_2FA': 'false'
    },

    // Variáveis adicionais esperadas no projeto
    additionalVars: [
        'REFRESH_TOKEN_EXPIRATION',
        'PASSWORD_SALT_ROUNDS',
        'MAX_LOGIN_ATTEMPTS',
        'LOGIN_BLOCK_DURATION',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS',
        'SMTP_FROM',
        'BASE_URL',
        'SALT_ROUNDS',
        'PASSWORD_RESET_EXPIRATION',
        'N8N_URL',
        'N8N_API_SECRET',
        'N8N_API_KEY',
        'RABBITMQ_URL',
        'TEST_USER_EMAIL',
        'TEST_USER_PASSWORD',
        'MICROSOFT_CLIENT_SECRET',
        'MICROSOFT_EMAIL_USER',
        'MICROSOFT_EMAIL_FROM',
        'MICROSOFT_EMAIL_FROM_NAME',
        'GRAPH_WEBHOOK_BASE_URL',
        'GRAPH_WEBHOOK_PATH',
        'GRAPH_WEBHOOK_SECRET',
        'GRAPH_WEBHOOK_CERT_THUMBPRINT',
        'SYSTEM_EMAIL_CONTACT_ID',
        'GRAPH_WEBHOOK_CERTIFICATE',
        'GRAPH_WEBHOOK_CERTIFICATE_ID'
    ]
};

// Função para validar arquivo de ambiente
function validateEnvFile(filePath) {
    console.log(`\n=== Validando arquivo: ${path.basename(filePath)} ===`);
    
    // Ler conteúdo do arquivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Carregar variáveis
    const parsedEnv = dotenv.parse(fileContent);
    
    // Resultados da validação
    const validationResults = {
        passed: [],
        warnings: [],
        errors: []
    };

    // Validar variáveis obrigatórias
    VALIDATION_RULES.required.forEach(key => {
        if (!parsedEnv[key]) {
            validationResults.errors.push(`❌ ${key}: Variável obrigatória não definida`);
        }
    });

    // Validar variáveis opcionais
    Object.entries(VALIDATION_RULES.optional).forEach(([key, rule]) => {
        const value = parsedEnv[key];
        if (value && !rule.validator(value)) {
            validationResults.errors.push(`❌ ${key}: ${rule.errorMsg}`);
        }
    });

    // Validadores específicos
    Object.entries(VALIDATION_RULES.validators).forEach(([key, validator]) => {
        const value = parsedEnv[key];
        if (value && !validator(value)) {
            validationResults.errors.push(`❌ ${key}: Valor inválido`);
        }
    });

    // Verificar variáveis duplicadas
    const duplicateVars = Object.keys(parsedEnv)
        .filter((key, index, self) => self.indexOf(key) !== index);
    
    if (duplicateVars.length > 0) {
        validationResults.warnings.push(`⚠️ Variáveis duplicadas: ${duplicateVars.join(', ')}`);
    }

    // Verificar variáveis não documentadas
    const documentedVars = [
        ...VALIDATION_RULES.required, 
        ...Object.keys(VALIDATION_RULES.optional),
        ...Object.keys(VALIDATION_RULES.validators),
        ...VALIDATION_RULES.additionalVars
    ];

    const undocumentedVars = Object.keys(parsedEnv)
        .filter(key => !documentedVars.includes(key));

    undocumentedVars.forEach(key => {
        // Ignorar variáveis específicas que são comuns em projetos
        const ignoredPrefixes = [
            'NODE_', 'npm_', 'VSCODE_', 'SSH_', 'XDG_', 
            'SHELL', 'HOME', 'USER', 'LANG', 'PATH'
        ];
        
        const isIgnored = ignoredPrefixes.some(prefix => key.startsWith(prefix));
        
        if (!isIgnored) {
            validationResults.warnings.push(`⚠️ Variável não documentada: ${key}`);
        }
    });

    // Imprimir resultados
    console.log('\nResumo da Validação:');
    
    if (validationResults.passed.length > 0) {
        console.log('Variáveis Válidas:', validationResults.passed.join(', '));
    }
    
    if (validationResults.warnings.length > 0) {
        console.log('\nAvisos:');
        validationResults.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (validationResults.errors.length > 0) {
        console.log('\nErros:');
        validationResults.errors.forEach(error => console.log(`  ${error}`));
    }

    return validationResults;
}

// Função principal
function validateEnvironmentFiles() {
    const envFiles = [
        path.resolve(__dirname, '..', '.env'),
        path.resolve(__dirname, '..', '.env.example'),
        path.resolve(__dirname, '..', '.env.local')
    ];

    console.log('🔍 Iniciando validação de arquivos de ambiente');

    const overallResults = {
        passed: 0,
        warnings: 0,
        errors: 0
    };

    envFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const results = validateEnvFile(filePath);
            
            overallResults.warnings += results.warnings.length;
            overallResults.errors += results.errors.length;
        } else {
            console.log(`Arquivo não encontrado: ${path.basename(filePath)}`);
        }
    });

    // Resumo geral
    console.log('\n📊 Resumo Geral:');
    console.log(`  ⚠️ Avisos: ${overallResults.warnings}`);
    console.log(`  ❌ Erros: ${overallResults.errors}`);

    // Código de saída baseado em erros
    process.exit(overallResults.errors > 0 ? 1 : 0);
}

// Executar validação
validateEnvironmentFiles();
