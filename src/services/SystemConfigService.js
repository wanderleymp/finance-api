const { Pool } = require('pg');

class SystemConfigService {
    constructor(pool) {
        this.pool = pool;
    }

    async getConfig(configKey) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT config_value, description FROM system_config WHERE config_key = $1',
                [configKey]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar configuração:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getAllConfigs() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('SELECT config_key, config_value, description FROM system_config');
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async createOrUpdateConfig(configKey, configValue, description = null) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            const existingConfig = await client.query(
                'SELECT id FROM system_config WHERE config_key = $1',
                [configKey]
            );

            if (existingConfig.rows.length > 0) {
                // Atualiza configuração existente
                await client.query(
                    'UPDATE system_config SET config_value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE config_key = $3',
                    [configValue, description, configKey]
                );
            } else {
                // Cria nova configuração
                await client.query(
                    'INSERT INTO system_config (config_key, config_value, description) VALUES ($1, $2, $3)',
                    [configKey, configValue, description]
                );
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao salvar configuração:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async deleteConfig(configKey) {
        const client = await this.pool.connect();
        try {
            await client.query('DELETE FROM system_config WHERE config_key = $1', [configKey]);
            return true;
        } catch (error) {
            console.error('Erro ao remover configuração:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async updateDbVersion(newVersion) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            const existingVersion = await client.query(
                'SELECT id FROM system_config WHERE config_key = $1',
                ['db_version']
            );

            if (existingVersion.rows.length > 0) {
                // Atualiza versão existente
                await client.query(
                    'UPDATE system_config SET config_value = $1, updated_at = CURRENT_TIMESTAMP WHERE config_key = $2',
                    [newVersion, 'db_version']
                );
            } else {
                // Cria nova versão
                await client.query(
                    'INSERT INTO system_config (config_key, config_value, description) VALUES ($1, $2, $3)',
                    ['db_version', newVersion, 'Versão atual do banco de dados']
                );
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao atualizar versão do banco:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async getCurrentDbVersion() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT config_value FROM system_config WHERE config_key = $1',
                ['db_version']
            );
            return result.rows[0]?.config_value || '0.0.0';
        } catch (error) {
            console.error('Erro ao buscar versão atual:', error);
            return '0.0.0';
        } finally {
            client.release();
        }
    }
}

module.exports = SystemConfigService;
