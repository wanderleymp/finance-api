const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { isCompatibleVersion } = require('../utils/version');
const { setupDatabase, createDatabaseBackup } = require('./setup');

class DatabaseMigrator {
    constructor(config, requiredDbVersion, appVersion) {
        this.config = config;
        this.requiredDbVersion = requiredDbVersion;
        this.appVersion = appVersion;
        this.pool = config.pool; // Usa o pool que já vem configurado
        this.client = null;
        this.backupPath = '/var/backups/finance-api-new';
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
                WHERE table_schema = 'public' 
                AND table_name = 'migrations'
            );
        `);
        return result.rows[0].exists;
    }

    async checkSystemConfigTable() {
        const result = await this.client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'system_config'
            );
        `);
        return result.rows[0].exists;
    }

    async getCurrentVersion() {
        try {
            const result = await this.client.query(`
                SELECT config_value as version 
                FROM system_config 
                WHERE config_key = 'db_version'
            `);
            return result.rows[0]?.version || '0.0.0';
        } catch (error) {
            console.log('⚠️ Erro ao obter versão atual:', error.message);
            return '0.0.0';
        }
    }

    async getPendingMigrations(files) {
        const pendingMigrations = [];
        
        for (const file of files) {
            try {
                // Verifica se a migração já foi executada
                const migrationResult = await this.client.query(
                    `SELECT COUNT(*) as count 
                     FROM migrations 
                     WHERE migration_name = $1 
                     AND database_name = $2`,
                    [file, this.config.database]
                );

                // Se a migração não foi registrada, verifica a estrutura da tabela
                if (parseInt(migrationResult.rows[0].count) === 0) {
                    // Se for uma migração para person_contacts, verifica a estrutura
                    if (file.includes('person_contacts')) {
                        const tableExists = await this.client.query(`
                            SELECT EXISTS (
                                SELECT FROM information_schema.tables 
                                WHERE table_schema = 'public' 
                                AND table_name = 'person_contacts'
                            );
                        `);

                        if (tableExists.rows[0].exists) {
                            // Verifica se a estrutura está correta
                            const columnsResult = await this.client.query(`
                                SELECT column_name, data_type 
                                FROM information_schema.columns 
                                WHERE table_schema = 'public' 
                                AND table_name = 'person_contacts'
                            `);

                            const columns = columnsResult.rows.map(row => row.column_name);
                            const requiredColumns = ['id', 'person_id', 'contact_type', 'contact_value', 'created_at', 'updated_at'];
                            const hasAllColumns = requiredColumns.every(col => columns.includes(col));

                            if (!hasAllColumns) {
                                pendingMigrations.push(file);
                                console.log(`⚠️ Tabela person_contacts existe mas estrutura está incompleta. Adicionando à lista de migrações pendentes.`);
                            } else {
                                // Se a tabela existe e está correta, registra a migração como executada
                                await this.client.query(
                                    `INSERT INTO migrations 
                                     (migration_name, db_version, database_name, description)
                                     VALUES ($1, $2, $3, $4)`,
                                    [file, this.requiredDbVersion, this.config.database, `Migração: ${file} (registrada após verificação)`]
                                );
                                console.log(`✅ Tabela person_contacts já existe com estrutura correta. Registrando migração.`);
                            }
                        } else {
                            pendingMigrations.push(file);
                        }
                    } else if (file.includes('person_documents')) {
                        const tableExists = await this.client.query(`
                            SELECT EXISTS (
                                SELECT FROM information_schema.tables 
                                WHERE table_schema = 'public' 
                                AND table_name = 'person_documents'
                            );
                        `);

                        if (tableExists.rows[0].exists) {
                            const expectedStructure = this.getExpectedStructure(file);
                            if (expectedStructure) {
                                const isStructureCorrect = await this.checkTableStructure(
                                    expectedStructure.tableName,
                                    expectedStructure.columns,
                                    expectedStructure.extraChecks
                                );

                                if (isStructureCorrect) {
                                    console.log(`✅ Tabela person_documents já existe com estrutura correta. Registrando migração.`);
                                    await this.registerMigration(file, `Estrutura verificada e registrada: ${expectedStructure.tableName}`);
                                    return;
                                }
                            }
                        }

                        pendingMigrations.push(file);
                    } else {
                        pendingMigrations.push(file);
                    }
                }
            } catch (error) {
                console.log(`⚠️ Erro ao verificar migração ${file}:`, error.message);
                // Se a tabela não existe, considera todas as migrações como pendentes
                if (error.code === '42P01') {
                    return files;
                }
                throw error;
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
        try {
            // Verifica se a estrutura já está como desejada
            const isStructureOk = await this.checkTableStructure(file);
            
            if (isStructureOk) {
                console.log(`✅ Estrutura já está correta para ${file}, apenas registrando migração`);
                await this.registerMigration(file, 'Estrutura já estava correta');
                return;
            }

            // Se não estiver ok, executa a migração
            console.log(`🔄 Executando migração: ${file}`);
            await this.client.query('BEGIN');
            try {
                await this.client.query(migrationContent);
                await this.registerMigration(file, 'Migração executada com sucesso');
                await this.client.query('COMMIT');
            } catch (error) {
                await this.client.query('ROLLBACK');
                throw error;
            }
        } catch (error) {
            console.error(`❌ Erro ao executar migração ${file}:`, error);
            throw error;
        }
    }

    async registerMigration(file, description = '') {
        try {
            await this.client.query(
                `INSERT INTO migrations 
                 (migration_name, db_version, database_name, description)
                 VALUES ($1, $2, $3, $4)`,
                [file, this.requiredDbVersion, this.config.database, description]
            );
            console.log(`✅ Migração ${file} registrada com sucesso`);
        } catch (error) {
            console.error(`❌ Erro ao registrar migração ${file}:`, error);
            throw error;
        }
    }

    getExpectedStructure(migrationFile) {
        // Mapeia cada arquivo de migração para sua estrutura esperada
        const structureMap = {
            '20241214_create_person_contacts.sql': {
                tableName: 'person_contacts',
                columns: [
                    { name: 'id', type: 'uuid' },
                    { name: 'person_id', type: 'uuid' },
                    { name: 'contact_type', type: 'character varying' },
                    { name: 'contact_value', type: 'character varying' },
                    { name: 'created_at', type: 'timestamp without time zone' },
                    { name: 'updated_at', type: 'timestamp without time zone' }
                ]
            },
            '20241214_adjust_person_documents.sql': {
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
            }
        };

        return structureMap[migrationFile] || null;
    }

    async updateSystemVersion() {
        try {
            // Verifica se já existe registro de versão
            const result = await this.client.query(`
                SELECT config_value 
                FROM system_config 
                WHERE config_key = 'db_version'
            `);

            if (result.rows.length > 0) {
                // Atualiza versão existente
                await this.client.query(`
                    UPDATE system_config 
                    SET config_value = $1, 
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE config_key = 'db_version'
                `, [this.requiredDbVersion]);
            } else {
                // Insere nova versão
                await this.client.query(`
                    INSERT INTO system_config 
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
        try {
            console.log('🚀 Iniciando processo de migração...');
            await this.init();

            const currentVersion = await this.getCurrentVersion();
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

            // Executa as migrações pendentes
            for (const file of pendingMigrations) {
                await this.executeMigration(file, this.getMigrationContent(file));
            }

            console.log('✅ Migrações concluídas com sucesso!');
        } catch (error) {
            console.error('❌ Erro durante migração:', error);
            throw error;
        } finally {
            if (this.client) {
                console.log('🔌 Fechando conexão com o banco...');
                this.client.release();
            }
        }
    }

    getMigrationFiles() {
        const migrationsPath = path.join(__dirname, '..', 'migrations');
        console.log(`📂 Buscando migrações em: ${migrationsPath}`);
        
        const directories = ['system'];
        let allMigrations = [];
        
        for (const dir of directories) {
            const dirPath = path.join(migrationsPath, dir);
            console.log(`  ↳ Verificando diretório: ${dir}`);
            
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.sql') && !file.endsWith('_down.sql'))
                    .sort();
                console.log(`    📄 Encontradas ${files.length} migrações`);
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
        const migrator = new DatabaseMigrator(config, '1.0.0');
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

        const migrator = new DatabaseMigrator(config, '1.0.0');
        await migrator.migrate();
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    }
}

module.exports = { runMigrations };
