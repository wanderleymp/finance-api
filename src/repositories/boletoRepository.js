const { systemDatabase } = require('../config/database');
const { logger } = require('../middlewares/logger');
const PaginationHelper = require('../utils/paginationHelper');
const { ValidationError } = require('../utils/errors');

class BoletoRepository {
    constructor() {
        this.pool = systemDatabase.pool;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const { limit: validLimit, offset } = PaginationHelper.getPaginationParams(page, limit);
            
            let query = `
                SELECT * 
                FROM boletos 
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            // Filtro por installment_id
            if (filters.installment_id) {
                query += ` AND installment_id = $${paramCount}`;
                params.push(filters.installment_id);
                paramCount++;
            }

            // Filtro por status
            if (filters.status) {
                query += ` AND status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            // Consulta de contagem
            const countQuery = query.replace('*', 'COUNT(*)');
            
            // Adicionar ordenação e paginação
            query += ` ORDER BY boleto_id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(validLimit, offset);

            logger.info('Executando consulta findAll de boletos', { 
                query,
                params,
                page,
                limit: validLimit,
                offset,
                filters
            });

            const [dataResult, countResult] = await Promise.all([
                this.pool.query(query, params),
                this.pool.query(countQuery, params.slice(0, -2))
            ]);

            return {
                data: dataResult.rows,
                total: parseInt(countResult.rows[0].count)
            };
        } catch (error) {
            logger.error('Erro ao buscar boletos', { 
                errorMessage: error.message,
                stack: error.stack,
                filters
            });
            throw error;
        }
    }

    async findById(boletoId) {
        try {
            const query = `
                SELECT * 
                FROM boletos 
                WHERE boleto_id = $1
            `;

            logger.info('Buscando boleto por ID', { boletoId });

            const result = await this.pool.query(query, [boletoId]);

            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', { 
                errorMessage: error.message,
                boletoId
            });
            throw error;
        }
    }

    async createBoleto(boletoData) {
        try {
            const query = `
                INSERT INTO boletos 
                (installment_id, boleto_number, boleto_url, status, 
                codigo_barras, linha_digitavel, pix_copia_e_cola, external_boleto_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;

            const values = [
                boletoData.installment_id,
                boletoData.boleto_number,
                boletoData.boleto_url || null,
                boletoData.status || 'Pendente',
                boletoData.codigo_barras,
                boletoData.linha_digitavel,
                boletoData.pix_copia_e_cola || null,
                boletoData.external_boleto_id || null
            ];

            logger.info('Criando novo boleto', { 
                installmentId: boletoData.installment_id,
                status: boletoData.status
            });

            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar boleto', { 
                errorMessage: error.message,
                boletoData
            });
            
            // Tratamento de erros específicos do banco de dados
            if (error.code === '23505') {  // Violação de restrição única
                throw new ValidationError('Já existe um boleto com este número');
            }
            
            throw error;
        }
    }

    async updateBoleto(boletoId, updateData) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            // Construir campos dinâmicos para atualização
            const updateableFields = [
                'installment_id', 'boleto_number', 'boleto_url', 'status', 
                'codigo_barras', 'linha_digitavel', 'pix_copia_e_cola', 'external_boleto_id'
            ];

            updateableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    updateFields.push(`${field} = $${paramCount}`);
                    values.push(updateData[field]);
                    paramCount++;
                }
            });

            if (updateFields.length === 0) {
                throw new ValidationError('Nenhum campo para atualizar');
            }

            values.push(boletoId);

            const query = `
                UPDATE boletos 
                SET ${updateFields.join(', ')}, last_status_update = NOW()
                WHERE boleto_id = $${paramCount}
                RETURNING *
            `;

            logger.info('Atualizando boleto', { 
                boletoId, 
                updatedFields: updateFields 
            });

            const result = await this.pool.query(query, values);

            if (result.rows.length === 0) {
                throw new ValidationError('Boleto não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar boleto', { 
                errorMessage: error.message,
                boletoId,
                updateData
            });
            throw error;
        }
    }

    async deleteBoleto(boletoId) {
        try {
            const query = `
                DELETE FROM boletos 
                WHERE boleto_id = $1
                RETURNING *
            `;

            logger.info('Excluindo boleto', { boletoId });

            const result = await this.pool.query(query, [boletoId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Boleto não encontrado');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao excluir boleto', { 
                errorMessage: error.message,
                boletoId
            });
            throw error;
        }
    }
}

module.exports = new BoletoRepository();
