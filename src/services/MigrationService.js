class MigrationService {
    constructor(pool) {
        this.pool = pool;
    }

    async registerMigration(migrationFile, requiredVersion, databaseName, status = 'Migração executada com sucesso') {
        try {
            const query = `
                INSERT INTO system_migrations 
                (migration_file, database_name, migration_version, status, applied_at) 
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (migration_file, database_name) DO UPDATE 
                SET status = EXCLUDED.status, 
                    applied_at = NOW()
            `;
            
            await this.pool.query(query, [
                migrationFile, 
                databaseName, 
                requiredVersion, 
                status
            ]);
        } catch (error) {
            console.warn(`Aviso ao registrar migração ${migrationFile}:`, error);
            // Não lança erro para permitir continuidade do processo
        }
    }

    async getMigrationsByDatabase(databaseName) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM migrations WHERE database_name = $1 ORDER BY applied_at DESC',
                [databaseName]
            );
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar migrações:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async checkMigrationExists(migrationFile, databaseName) {
        try {
            const result = await this.pool.query(
                'SELECT 1 FROM system_migrations WHERE migration_file = $1 AND database_name = $2', 
                [migrationFile, databaseName]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.warn(`Erro ao verificar existência de migração ${migrationFile}:`, error);
            return false;
        }
    }
}

module.exports = MigrationService;
