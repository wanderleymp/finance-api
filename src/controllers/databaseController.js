const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');

class DatabaseController {
    async getTableSchema(req, res) {
        try {
            const { tableName } = req.params;
            
            const query = `
                SELECT 
                    column_name, 
                    data_type, 
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM 
                    information_schema.columns
                WHERE 
                    table_name = $1
            `;

            const result = await systemDatabase.query(query, [tableName]);
            
            res.json({
                tableName,
                schema: result.rows
            });
        } catch (error) {
            logger.error('Erro ao buscar esquema da tabela', { 
                error: error.message,
                tableName: req.params.tableName
            });
            res.status(500).json({ 
                error: 'Erro ao buscar esquema da tabela',
                details: error.message 
            });
        }
    }

    async getTableData(req, res) {
        try {
            const { tableName } = req.params;
            const { limit = 10, offset = 0 } = req.query;

            const query = `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`;
            const result = await systemDatabase.query(query, [limit, offset]);
            
            res.json({
                tableName,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error) {
            logger.error('Erro ao buscar dados da tabela', { 
                error: error.message,
                tableName: req.params.tableName
            });
            res.status(500).json({ 
                error: 'Erro ao buscar dados da tabela',
                details: error.message 
            });
        }
    }
}

module.exports = new DatabaseController();
