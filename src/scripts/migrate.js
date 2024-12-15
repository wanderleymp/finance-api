const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { isCompatibleVersion } = require('../utils/version');
const { setupDatabase, createDatabaseBackup } = require('./setup');
const { requiredDbVersion } = require('../config/version');
const SystemConfigService = require('../services/SystemConfigService');
const MigrationService = require('../services/MigrationService');

const DISABLE_MIGRATIONS = process.env.DISABLE_MIGRATIONS === 'true';

class DatabaseMigrator {
    constructor(config, requiredDbVersion, appVersion) {
        this.config = config;
        this.requiredDbVersion = requiredDbVersion;
        this.appVersion = appVersion;
        this.pool = config.pool; // Usa o pool que já vem configurado
        this.client = null;
        this.backupPath = '/var/backups/finance-api-new';
        
        // Inicializar serviços
        this.systemConfigService = new SystemConfigService(this.pool);
        this.migrationService = new MigrationService(this.pool);
    }

    async init() {
        try {
            // Garantir diretório de backup
            if (!fs.existsSync(this.backupPath)) {
                fs.mkdirSync(this.backupPath, { recursive: true });
            }

            this.client = await this.pool.connect();
            console.log('🔌 Conectado ao banco de dados');

            // Verifica se as tabelas essenciais existem
            const hasMigrations = await this.checkMigrationTable();
            const hasSystemConfig = await this.checkSystemConfigTable();

            // Só faz setup se as tabelas essenciais não existirem
            if (!hasMigrations || !hasSystemConfig) {
                console.log('🔧 Realizando setup inicial do banco...');
                await setupDatabase(this.client);
            }

        } catch (error) {
            console.error('❌ Erro ao conectar ao banco:', error);
            throw error;
        }
    }

    async checkMigrationTable() {
        const result = await this.client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'system' 
                AND table_name = 'migrations'
            );
        `);
        return result.rows[0].exists;
    }

    async checkSystemConfigTable() {
        const result = await this.client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'system' 
                AND table_name = 'system_config'
            );
        `);
        return result.rows[0].exists;
    }

    async getCurrentVersion() {
        try {
            return await this.systemConfigService.getCurrentDbVersion();
        } catch (error) {
            console.error('Erro ao buscar versão atual:', error);
            return '0.0.0';
        }
    }

    async validateVersion() {
        const currentVersion = await this.getCurrentVersion();
        
        // Se a versão atual for nula ou precisar de atualização
        if (!currentVersion || this.isCompatibleVersion(currentVersion, this.requiredDbVersion)) {
            try {
                // Atualiza a versão do sistema
                await this.systemConfigService.updateDbVersion(this.requiredDbVersion);
                console.log(`📦 Versão atualizada de ${currentVersion || 'N/A'} para ${this.requiredDbVersion}`);
            } catch (versionUpdateError) {
                console.warn('Erro ao atualizar versão durante validação:', versionUpdateError);
            }
        }

        return currentVersion || this.requiredDbVersion;
    }

    isCompatibleVersion(currentVersion, requiredVersion) {
        if (!currentVersion) return true;

        // Divide as versões em partes numéricas
        const currentParts = currentVersion.split('.').map(Number);
        const requiredParts = requiredVersion.split('.').map(Number);

        // Compara cada parte da versão
        for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
            const current = currentParts[i] || 0;
            const required = requiredParts[i] || 0;

            if (current < required) {
                return true; // Permite atualização se versão atual for menor
            }
            if (current > required) {
                return false; // Impede downgrade
            }
        }

        return false; // Versões são iguais, não precisa atualizar
    }

    async getPendingMigrations(files) {
        const pendingMigrations = [];
        const currentVersion = await this.getCurrentVersion();
        
        for (const file of files) {
            try {
                // Extrai a versão do nome do arquivo
                const versionMatch = file.match(/(\d{8})_\w+\.sql/);
                if (!versionMatch) {
                    console.log(`    ⚠️ Arquivo sem versão: ${file}`);
                    continue;
                }

                // Verifica se a migração já foi registrada
                const migrationResult = await this.client.query(`
                    SELECT COUNT(*) as count, MAX(applied_at) as last_applied 
                    FROM system.migrations 
                    WHERE migration_name = $1 
                    AND database_name = $2
                `, [file, this.config.database]);

                const migrationCount = parseInt(migrationResult.rows[0].count);
                const lastApplied = migrationResult.rows[0].last_applied;

                // Adiciona à lista de migrações pendentes se:
                // 1. Nenhuma migração foi registrada, ou
                // 2. A migração foi registrada há mais de 1 minuto (para evitar duplicatas rápidas)
                const oneMinuteAgo = new Date(Date.now() - 60000);
                const isOldMigration = lastApplied && new Date(lastApplied) < oneMinuteAgo;

                if (migrationCount === 0 || isOldMigration) {
                    console.log(`⚠️ Migração ${file} precisa ser aplicada. Contagem: ${migrationCount}, Última aplicação: ${lastApplied}`);
                    pendingMigrations.push(file);
                } else {
                    console.log(`✅ Migração ${file} já registrada recentemente.`);
                }
            } catch (error) {
                console.log(`⚠️ Erro ao verificar migração ${file}:`, error.message);
                // Se houver erro, considera a migração como pendente
                pendingMigrations.push(file);
            }
        }

        return pendingMigrations;
    }

    async checkTableStructure(tableName, columns, extraChecks) {
        try {
            const result = await this.client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
            `, [tableName]);

            const tableColumns = result.rows.map(row => ({ name: row.column_name, type: row.data_type }));
            const hasAllColumns = columns.every(col => tableColumns.find(tableCol => tableCol.name === col.name && tableCol.type === col.type));

            if (extraChecks) {
                const extraCheckResult = await extraChecks(this.client);
                return hasAllColumns && extraCheckResult;
            }

            return hasAllColumns;
        } catch (error) {
            console.error('Erro ao verificar estrutura:', error);
            return false;
        }
    }

    async executeMigration(file, migrationContent) {
        let client;
        try {
            // Verificar se migração já foi aplicada
            const migrationExists = await this.migrationService.checkMigrationExists(file, this.config.database);
            
            // Conecta ao banco
            client = await this.pool.connect();

            // Sempre tenta registrar a migração, mesmo que já exista
            try {
                await this.migrationService.registerMigration(
                    file, 
                    this.requiredDbVersion, 
                    this.config.database, 
                    migrationExists ? 'Migração já aplicada anteriormente' : 'Migração executada com sucesso'
                );
            } catch (registrationError) {
                console.warn(`Aviso ao registrar migração ${file}`);
            }

            // Força atualização da versão do sistema
            try {
                await this.systemConfigService.updateDbVersion(this.requiredDbVersion);
            } catch (versionUpdateError) {
                console.warn(`Erro ao atualizar versão para migração ${file}`);
            }

            // Se a migração já existir, apenas retorna
            if (migrationExists) {
                console.log(`⚠️ Migração ${file} já foi aplicada. Pulando execução.`);
                return;
            }

            // Inicia transação para executar migração
            await client.query('BEGIN');

            try {
                // Executa o script de migração com suporte a IF NOT EXISTS
                const modifiedMigrationContent = migrationContent
                    .replace(/CREATE\s+(?:UNIQUE\s+)?INDEX/gi, 'CREATE INDEX IF NOT EXISTS')
                    .replace(/CREATE\s+TABLE/gi, 'CREATE TABLE IF NOT EXISTS')
                    .replace(/CREATE\s+(?:UNIQUE\s+)?CONSTRAINT/gi, 'CREATE CONSTRAINT IF NOT EXISTS')
                    // Remove comentários de bloco
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    // Remove comentários de linha
                    .replace(/--.*$/gm, '');

                // Executa cada instrução SQL separadamente
                const sqlStatements = modifiedMigrationContent
                    .split(';')
                    .map(statement => statement.trim())
                    .filter(statement => statement.length > 0);

                for (const statement of sqlStatements) {
                    try {
                        await client.query(statement);
                    } catch (statementError) {
                        // Apenas loga erros críticos
                        if (
                            !statementError.message.includes('already exists') && 
                            !statementError.message.includes('duplicate')
                        ) {
                            console.error(`❌ Erro crítico na migração ${file}:`, statementError.message);
                            throw statementError;
                        }
                    }
                }

                // Commita a transação
                await client.query('COMMIT');
                console.log(`✅ Migração ${file} concluída com sucesso`);
            } catch (executionError) {
                // Rollback em caso de erro
                await client.query('ROLLBACK');
                
                console.error(`❌ Erro ao executar migração ${file}:`, executionError.message);
                throw executionError;
            }
        } catch (error) {
            console.error(`❌ Erro no processo de migração ${file}:`, error.message);
            throw error;
        } finally {
            // Garante liberação do cliente
            if (client) {
                try {
                    client.release();
                } catch (releaseError) {
                    console.warn('Aviso: Erro ao liberar cliente de banco de dados');
                }
            }
        }
    }

    async registerMigration(file, description = '') {
        try {
            await this.migrationService.registerMigration(
                file, 
                this.requiredDbVersion, 
                this.config.database, 
                description
            );
            console.log(`✅ Migração ${file} registrada com sucesso`);
        } catch (error) {
            console.error(`❌ Erro ao registrar migração ${file}:`, error);
            throw error;
        }
    }

    getExpectedStructure(migrationFile) {
        const expectedStructures = {
            'licenses': {
                tableName: 'licenses',
                columns: [
                    { name: 'license_id', type: 'integer' },
                    { name: 'person_id', type: 'integer' },
                    { name: 'license_name', type: 'character varying' },
                    { name: 'start_date', type: 'date' },
                    { name: 'end_date', type: 'date' },
                    { name: 'status', type: 'USER-DEFINED' },
                    { name: 'timezone', type: 'character varying' },
                    { name: 'active', type: 'boolean' },
                    { name: 'created_at', type: 'timestamp with time zone' },
                    { name: 'updated_at', type: 'timestamp with time zone' }
                ],
                async extraChecks(client) {
                    try {
                        // Verifica se o ENUM existe e tem os valores corretos
                        const enumResult = await client.query(`
                            SELECT e.enumlabel
                            FROM pg_type t 
                            JOIN pg_enum e ON t.oid = e.enumtypid  
                            WHERE t.typname = 'license_status_enum'
                            ORDER BY e.enumsortorder;
                        `);
                        
                        const expectedEnumValues = ['Ativa', 'Inativa', 'Suspensa', 'Cancelada'];
                        const currentEnumValues = enumResult.rows.map(row => row.enumlabel);
                        
                        return expectedEnumValues.every(val => currentEnumValues.includes(val));
                    } catch (error) {
                        console.error('Erro na verificação extra:', error);
                        return false;
                    }
                }
            },
            'person_documents': {
                tableName: 'person_documents',
                columns: [
                    { name: 'id', type: 'uuid' },
                    { name: 'person_id', type: 'uuid' },
                    { name: 'document_type', type: 'user-defined' }, // tipo ENUM
                    { name: 'document_number', type: 'character varying' },
                    { name: 'created_at', type: 'timestamp without time zone' },
                    { name: 'updated_at', type: 'timestamp without time zone' }
                ],
                // Adiciona verificação específica para o ENUM
                async extraChecks(client) {
                    try {
                        // Verifica se o ENUM existe e tem os valores corretos
                        const enumResult = await client.query(`
                            SELECT e.enumlabel
                            FROM pg_type t 
                            JOIN pg_enum e ON t.oid = e.enumtypid  
                            WHERE t.typname = 'document_type_enum'
                            ORDER BY e.enumsortorder;
                        `);
                        
                        const expectedEnumValues = ['CPF', 'CNPJ', 'RG', 'CNH', 'OUTROS'];
                        const currentEnumValues = enumResult.rows.map(row => row.enumlabel);
                        
                        const hasCorrectEnum = expectedEnumValues.every(val => 
                            currentEnumValues.includes(val)
                        );

                        // Verifica se persons tem a coluna active
                        const personsResult = await client.query(`
                            SELECT column_name, data_type 
                            FROM information_schema.columns 
                            WHERE table_name = 'persons' 
                            AND column_name = 'active';
                        `);
                        
                        const hasActiveColumn = personsResult.rows.length > 0;

                        return hasCorrectEnum && hasActiveColumn;
                    } catch (error) {
                        console.error('Erro na verificação extra:', error);
                        return false;
                    }
                }
            },
            'person_contacts': {
                tableName: 'person_contacts',
                columns: [
                    { name: 'person_contact_id', type: 'integer' },
                    { name: 'person_id', type: 'integer' },
                    { name: 'contact_id', type: 'integer' },
                    { name: 'is_main', type: 'boolean' },
                    { name: 'active', type: 'boolean' },
                    { name: 'description', type: 'text' },
                    { name: 'created_at', type: 'timestamp with time zone' },
                    { name: 'updated_at', type: 'timestamp with time zone' }
                ]
            }
        };

        const fileName = path.basename(migrationFile);
        const tableName = fileName.replace('.sql', '').split('_').slice(1).join('_');
        return expectedStructures[tableName] || null;
    }

    async updateSystemVersion() {
        try {
            // Verifica se já existe registro de versão
            const result = await this.client.query(`
                SELECT config_value 
                FROM system.system_config 
                WHERE config_key = 'db_version'
            `);

            if (result.rows.length > 0) {
                // Atualiza versão existente
                await this.client.query(`
                    UPDATE system.system_config 
                    SET config_value = $1, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE config_key = 'db_version'
                `, [this.requiredDbVersion]);
            } else {
                // Insere nova versão
                await this.client.query(`
                    INSERT INTO system.system_config 
                    (config_key, config_value, description) 
                    VALUES ('db_version', $1, 'Versão atual do banco de dados')
                `, [this.requiredDbVersion]);
            }

            console.log(`✅ Versão do sistema atualizada para ${this.requiredDbVersion}`);
        } catch (error) {
            console.error('❌ Erro ao atualizar versão do sistema:', error);
            throw error;
        }
    }

    async migrate() {
        if (DISABLE_MIGRATIONS) {
            console.log('🚫 Migrações desabilitadas');
            return;
        }

        let client;
        try {
            console.log('🚀 Iniciando processo de migração...');
            await this.init();

            const currentVersion = await this.validateVersion();
            console.log(`📊 Versão atual do banco: ${currentVersion}`);
            console.log(`📊 Versão requerida: ${this.requiredDbVersion}`);

            // Verifica se há migrações pendentes antes de fazer backup
            const files = this.getMigrationFiles();
            const pendingMigrations = await this.getPendingMigrations(files);

            // Só faz backup se houver migrações pendentes
            if (pendingMigrations.length > 0) {
                console.log('📦 Iniciando backup pré-migração...');
                await createDatabaseBackup(this.client, this.backupPath, this.config.database);
            }

            console.log('📂 Buscando migrações em:', path.resolve(process.cwd(), 'src/migrations'));
            console.log('  ↳ Verificando diretório:', this.config.database);
            console.log(`    📄 Encontradas ${files.length} migrações`);

            console.log('🔍 Verificando migrações pendentes...');
            console.log(`  ↳ ${pendingMigrations.length} migrações pendentes encontradas`);

            if (pendingMigrations.length === 0) {
                console.log('✅ Banco já está atualizado!');
                return;
            }

            // Conecta ao banco
            client = await this.pool.connect();
            this.client = client;

            // Executa as migrações pendentes
            for (const file of pendingMigrations) {
                try {
                    await this.executeMigration(file, this.getMigrationContent(file));
                } catch (migrationError) {
                    // Interrompe o processo de migração na primeira falha
                    console.error(`❌ Falha na migração ${file}. Interrompendo processo.`);
                    throw migrationError;
                }
            }

            console.log('✅ Migrações concluídas com sucesso!');
        } catch (error) {
            console.error('❌ Erro durante migração:', error);
            throw error;
        } finally {
            // Garante liberação do cliente
            if (client) {
                try {
                    client.release();
                } catch (releaseError) {
                    console.warn('Aviso: Erro ao liberar cliente de banco de dados');
                }
            }
        }
    }

    getMigrationFiles() {
        let allMigrations = [];
        const migrationDirs = [
            path.join(__dirname, '..', 'migrations', 'system')
        ];

        for (const dirPath of migrationDirs) {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.sql'))
                    .filter(file => {
                        const versionMatch = file.match(/(\d{8})_\w+\.sql/);
                        if (!versionMatch) {
                            console.log(`    ⚠️ Arquivo sem versão: ${file}`);
                            return false;
                        }

                        const fileVersion = versionMatch[1];
                        // Permite migrações com data igual ou superior à versão atual
                        const isValidVersion = parseInt(fileVersion) >= parseInt(this.requiredDbVersion.replace(/\./g, ''));
                        
                        if (isValidVersion) {
                            console.log(`    📄 Arquivo ${file} - Versão ${fileVersion}`);
                        }
                        
                        return isValidVersion;
                    })
                    .sort();
                console.log(`    📄 Encontradas ${files.length} migrações para versão ${this.requiredDbVersion}`);
                allMigrations = [...allMigrations, ...files];
            } else {
                console.log(`    ⚠️ Diretório não encontrado: ${dirPath}`);
            }
        }

        return allMigrations;
    }

    getMigrationContent(file) {
        const migrationPath = path.join(__dirname, '..', 'migrations', 'system', file);
        console.log(`  ↳ Executando: ${file}`);
        
        return fs.readFileSync(migrationPath, 'utf8');
    }

    static async runMigrations(config) {
        const migrator = new DatabaseMigrator(config, requiredDbVersion, '1.0.0');
        await migrator.migrate();
    }
}

async function runMigrations(config) {
    try {
        console.log('🚀 Iniciando processo de migração');
        console.log('📦 Configurações de banco de dados:', config);

        if (!config || !config.pool) {
            throw new Error('Configuração de banco inválida: pool não encontrado');
        }

        const migrator = new DatabaseMigrator(config, requiredDbVersion, requiredDbVersion);
        await migrator.migrate();
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    }
}

module.exports = { runMigrations };
