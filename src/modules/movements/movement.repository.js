const BaseRepository = require('../../repositories/base/BaseRepository');
const { logger } = require('../../middlewares/logger');

class MovementRepository extends BaseRepository {
    constructor() {
        super('movements', 'movement_id');
    }

    /**
     * Lista todos os movimentos com filtros
     */
    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            // Prepara os filtros
            const queryParams = [];
            const conditions = [];
            let paramCount = 1;

            // Mapeamento de colunas permitidas para ordenação
            const allowedOrderColumns = {
                'movement_id': 'm.movement_id',
                'created_at': 'm.created_at',
                'movement_date': 'm.movement_date',
                'description': 'm.description',
                'total_amount': 'm.total_amount'
            };

            // Construção da cláusula ORDER BY
            let orderByClause = 'ORDER BY m.created_at DESC';  // Default ordering
            if (filters.order_by && allowedOrderColumns[filters.order_by]) {
                const direction = (filters.order_direction || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
                orderByClause = `ORDER BY ${allowedOrderColumns[filters.order_by]} ${direction}`;
            }

            // Filtros básicos
            if (filters.person_id) {
                conditions.push(`m.person_id = $${paramCount}`);
                queryParams.push(filters.person_id);
                paramCount++;
            }

            if (filters.movement_type_id) {
                conditions.push(`m.movement_type_id = $${paramCount}`);
                queryParams.push(filters.movement_type_id);
                paramCount++;
            }

            if (filters.movement_status_id) {
                conditions.push(`m.movement_status_id = $${paramCount}`);
                queryParams.push(filters.movement_status_id);
                paramCount++;
            }

            // Filtro por valor (range)
            if (filters.value_min) {
                conditions.push(`m.total_amount >= $${paramCount}`);
                queryParams.push(filters.value_min);
                paramCount++;
            }
            if (filters.value_max) {
                conditions.push(`m.total_amount <= $${paramCount}`);
                queryParams.push(filters.value_max);
                paramCount++;
            }

            // Filtros de data
            if (filters.movement_date_start) {
                conditions.push(`DATE(m.movement_date) >= DATE($${paramCount})`);
                queryParams.push(filters.movement_date_start);
                paramCount++;
            }
            if (filters.movement_date_end) {
                conditions.push(`DATE(m.movement_date) <= DATE($${paramCount})`);
                queryParams.push(filters.movement_date_end);
                paramCount++;
            }

            // Filtro por texto (description)
            if (filters.search) {
                conditions.push(`m.description ILIKE $${paramCount}`);
                queryParams.push(`%${filters.search}%`);
                paramCount++;
            }

            // Monta a cláusula WHERE
            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Query principal
            const query = `
                SELECT m.*
                FROM movements m
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount} OFFSET $${paramCount + 1}
            `;

            // Query de contagem
            const countQuery = `
                SELECT COUNT(*) as total
                FROM movements m
                ${whereClause}
            `;

            // Adiciona os parâmetros de paginação
            queryParams.push(limit, offset);

            // Log da query
            logger.info('Repository: Executando query', { 
                query,
                countQuery,
                queryParams,
                paramCount
            });

            // Executa as queries
            const [result, countResult] = await Promise.all([
                this.pool.query(query, queryParams),
                this.pool.query(countQuery, queryParams.slice(0, -2))
            ]);

            return {
                data: result.rows,
                total: parseInt(countResult.rows[0].total)
            };
        } catch (error) {
            logger.error('Erro ao listar registros', { 
                error: error.message,
                tableName: this.tableName,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca um movimento por ID
     */
    async findById(id) {
        try {
            const query = `
                SELECT m.*
                FROM movements m
                WHERE m.movement_id = $1
            `;

            const { rows } = await this.pool.query(query, [id]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar registro por ID', {
                error: error.message,
                tableName: this.tableName,
                id
            });
            throw error;
        }
    }
}

module.exports = MovementRepository;
