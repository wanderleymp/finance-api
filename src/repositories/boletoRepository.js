const BaseRepository = require('./base/BaseRepository');
const TransactionHelper = require('../utils/transactionHelper');
const BoletoValidations = require('../validations/boletoValidations');
const { logger } = require('../middlewares/logger');

class BoletoRepository extends BaseRepository {
    constructor() {
        super('boletos');
    }

    /**
     * Lista boletos com informações relacionadas
     * @param {number} page - Número da página
     * @param {number} limit - Limite de itens por página
     * @param {Object} filters - Filtros a serem aplicados
     * @param {Object} orderBy - Configuração de ordenação
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Lista paginada de boletos
     */
    async findAllWithRelations(page = 1, limit = 10, filters = {}, orderBy = {}, client) {
        try {
            const { whereClause, queryParams, paramCount } = this.buildWhereClause(filters);
            const orderByClause = this.buildOrderByClause(orderBy);
            const offset = (page - 1) * limit;

            const query = `
                SELECT 
                    b.*,
                    m.description as movement_description,
                    m.type as movement_type,
                    m.status as movement_status
                FROM boletos b
                LEFT JOIN movements m ON b.movement_id = m.id
                ${whereClause}
                ${orderByClause}
                LIMIT $${paramCount}
                OFFSET $${paramCount + 1}
            `;

            const countQuery = `
                SELECT COUNT(*)::integer
                FROM boletos b
                LEFT JOIN movements m ON b.movement_id = m.id
                ${whereClause}
            `;

            const dbClient = TransactionHelper.getClient(client);
            const [resultQuery, countResult] = await Promise.all([
                dbClient.query(query, [...queryParams, limit, offset]),
                dbClient.query(countQuery, queryParams)
            ]);

            const totalItems = countResult.rows[0].count;
            const totalPages = Math.ceil(totalItems / limit);

            return {
                data: resultQuery.rows,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Erro ao listar boletos com relações', {
                error: error.message,
                filters
            });
            throw error;
        }
    }

    /**
     * Busca boleto por ID com informações relacionadas
     * @param {number} id - ID do boleto
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Boleto encontrado
     */
    async findByIdWithRelations(id, client) {
        try {
            const query = `
                SELECT 
                    b.*,
                    m.description as movement_description,
                    m.type as movement_type,
                    m.status as movement_status
                FROM boletos b
                LEFT JOIN movements m ON b.movement_id = m.id
                WHERE b.id = $1
            `;

            const result = await TransactionHelper.getClient(client)
                .query(query, [id]);
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID com relações', {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Atualiza o status de um boleto
     * @param {number} id - ID do boleto
     * @param {string} status - Novo status
     * @param {Object} [client] - Client opcional para transação
     * @returns {Promise<Object>} Boleto atualizado
     */
    async updateStatus(id, status, client) {
        return TransactionHelper.executeInTransaction(async (dbClient) => {
            // Busca boleto atual
            const current = await this.findById(id, dbClient);
            if (!current) {
                throw new Error('Boleto não encontrado');
            }

            // Valida transição de status
            BoletoValidations.validateStatusUpdate(status, current.status);

            // Atualiza status
            const updated = await this.update(id, { 
                status,
                paid_date: status === 'PAID' ? new Date() : null
            }, dbClient);

            // Se boleto foi pago, atualiza status do movimento
            if (status === 'PAID') {
                const movementRepository = new BaseRepository('movements');
                await movementRepository.update(
                    current.movement_id,
                    { status: 'PAID' },
                    dbClient
                );
            }

            return updated;
        });
    }

    /**
     * Cria vários boletos para um movimento
     * @param {Object} movement - Movimento
     * @param {Object[]} boletos - Array de boletos
     * @returns {Promise<Object[]>} Boletos criados
     */
    async createMany(movement, boletos) {
        // Valida boletos
        BoletoValidations.validateMany(boletos);

        return TransactionHelper.executeInTransaction(async (client) => {
            const boletosWithMovementId = boletos.map(boleto => ({
                ...boleto,
                movement_id: movement.id
            }));

            return this.createMany(boletosWithMovementId, client);
        });
    }

    /**
     * Atualiza vários boletos
     * @param {Object[]} boletos - Array de boletos
     * @returns {Promise<Object[]>} Boletos atualizados
     */
    async updateMany(boletos) {
        return TransactionHelper.executeInTransaction(async (client) => {
            const results = [];

            for (const boleto of boletos) {
                // Valida dados
                BoletoValidations.validateBoletoUpdate(boleto);

                // Busca boleto atual
                const current = await this.findById(boleto.id, client);
                if (!current) {
                    throw new Error(`Boleto ${boleto.id} não encontrado`);
                }

                // Valida transição de status se houver mudança
                if (boleto.status && boleto.status !== current.status) {
                    BoletoValidations.validateStatusUpdate(boleto.status, current.status);
                }

                // Atualiza boleto
                const updated = await this.update(boleto.id, boleto, client);
                results.push(updated);
            }

            return results;
        });
    }

    async getBoletoById(boletoId) {
        try {
            const query = 'SELECT * FROM boletos WHERE boleto_id = $1';
            const { rows } = await this.pool.query(query, [boletoId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', {
                boletoId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async createBoleto(boletoData) {
        try {
            const query = `
                INSERT INTO boletos (
                    installment_id, 
                    valor, 
                    vencimento, 
                    status
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const params = [
                boletoData.installment_id,
                boletoData.valor,
                boletoData.vencimento,
                boletoData.status
            ];

            const { rows } = await this.pool.query(query, params);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao criar boleto', {
                boletoData,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async updateBoletoStatus(boletoId, status) {
        try {
            const query = `
                UPDATE boletos 
                SET status = $1, 
                    last_status_update = NOW() 
                WHERE boleto_id = $2
                RETURNING *
            `;

            const { rows } = await this.pool.query(query, [status, boletoId]);
            return rows[0];
        } catch (error) {
            logger.error('Erro ao atualizar status do boleto', {
                boletoId,
                status,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async getParcelasMovimento(movimentoId) {
        try {
            const query = `
                SELECT 
                    i.installment_id,
                    i.amount as valor,
                    i.due_date as vencimento,
                    i.installment_number,
                    m.movement_id
                FROM installments i
                JOIN movement_payments mp ON mp.payment_id = i.payment_id
                JOIN movements m ON m.movement_id = mp.movement_id
                WHERE m.movement_id = $1
                ORDER BY i.installment_number
            `;

            const { rows } = await this.pool.query(query, [movimentoId]);
            return rows;
        } catch (error) {
            logger.error('Erro ao buscar parcelas do movimento', {
                movimentoId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async getDadosBoleto(installmentId) {
        try {
            const query = `
                WITH installment_data AS (
                    SELECT 
                        i.installment_id, 
                        i.amount AS valor_nominal, 
                        i.due_date, 
                        i.installment_number AS seu_numero,
                        m.license_id,
                        m.person_id AS pagador_person_id
                    FROM installments i
                    JOIN movement_payments mp ON mp.payment_id = i.payment_id
                    JOIN movements m ON m.movement_id = mp.movement_id
                    WHERE i.installment_id = $1
                ),
                pagador_data AS (
                    SELECT 
                        json_build_object(
                            'full_name', p.full_name,
                            'documents', (
                                SELECT json_agg(
                                    json_build_object(
                                        'document_type', d.document_type,
                                        'document_value', d.document_value
                                    )
                                )
                                FROM person_documents d 
                                WHERE d.person_id = p.person_id
                            ),
                            'addresses', (
                                SELECT json_agg(
                                    json_build_object(
                                        'street', a.street,
                                        'number', a.number,
                                        'neighborhood', a.neighborhood,
                                        'city', a.city,
                                        'state', a.state,
                                        'postal_code', a.postal_code
                                    )
                                )
                                FROM person_addresses a
                                WHERE a.person_id = p.person_id
                            )
                        ) AS pagador_details
                    FROM installment_data id
                    JOIN persons p ON p.person_id = id.pagador_person_id
                ),
                beneficiario_data AS (
                    SELECT 
                        json_build_object(
                            'full_name', p.full_name,
                            'documents', (
                                SELECT json_agg(
                                    json_build_object(
                                        'document_type', d.document_type,
                                        'document_value', d.document_value
                                    )
                                )
                                FROM person_documents d 
                                WHERE d.person_id = p.person_id
                            ),
                            'addresses', (
                                SELECT json_agg(
                                    json_build_object(
                                        'street', a.street,
                                        'number', a.number,
                                        'neighborhood', a.neighborhood,
                                        'city', a.city,
                                        'state', a.state,
                                        'postal_code', a.postal_code
                                    )
                                )
                                FROM person_addresses a
                                WHERE a.person_id = p.person_id
                            )
                        ) AS beneficiario_details
                    FROM installment_data id
                    JOIN licenses l ON l.license_id = id.license_id
                    JOIN persons p ON p.person_id = l.person_id
                )
                SELECT 
                    id.*,
                    pd.pagador_details,
                    bd.beneficiario_details
                FROM installment_data id, 
                     pagador_data pd, 
                     beneficiario_data bd
            `;

            const { rows } = await this.pool.query(query, [installmentId]);

            if (rows.length === 0) {
                throw new ValidationError('Dados para geração de boleto não encontrados');
            }

            const dadosBoleto = rows[0];

            // Determinar tipo de pessoa e documento para pagador
            const documentoPagador = dadosBoleto.pagador_details.documents.find(
                doc => ['cpf', 'cnpj'].includes(doc.document_type.toLowerCase())
            );
            const tipoPessoaPagador = documentoPagador.document_type.toLowerCase() === 'cpf' ? 'FISICA' : 'JURIDICA';

            // Determinar tipo de pessoa e documento para beneficiário
            const documentoBeneficiario = dadosBoleto.beneficiario_details.documents.find(
                doc => ['cpf', 'cnpj'].includes(doc.document_type.toLowerCase())
            );
            const tipoPessoaBeneficiario = documentoBeneficiario.document_type.toLowerCase() === 'cpf' ? 'FISICA' : 'JURIDICA';

            // Selecionar primeiro endereço disponível
            const enderecoPagador = dadosBoleto.pagador_details.addresses?.[0] || {};
            const enderecoBeneficiario = dadosBoleto.beneficiario_details.addresses?.[0] || {};

            // Montar JSON de boleto
            return {
                seuNumero: dadosBoleto.seu_numero,
                valorNominal: dadosBoleto.valor_nominal,
                dataVencimento: dadosBoleto.due_date.toISOString().split('T')[0],
                pagador: {
                    cpfCnpj: documentoPagador.document_value,
                    tipoPessoa: tipoPessoaPagador,
                    nome: dadosBoleto.pagador_details.full_name,
                    endereco: enderecoPagador.street,
                    numero: enderecoPagador.number,
                    bairro: enderecoPagador.neighborhood,
                    cidade: enderecoPagador.city,
                    uf: enderecoPagador.state,
                    cep: enderecoPagador.postal_code
                },
                beneficiarioFinal: {
                    cpfCnpj: documentoBeneficiario.document_value,
                    tipoPessoa: tipoPessoaBeneficiario,
                    nome: dadosBoleto.beneficiario_details.full_name,
                    endereco: enderecoBeneficiario.street,
                    numero: enderecoBeneficiario.number,
                    bairro: enderecoBeneficiario.neighborhood,
                    cidade: enderecoBeneficiario.city,
                    uf: enderecoBeneficiario.state,
                    cep: enderecoBeneficiario.postal_code
                }
            };
        } catch (error) {
            logger.error('Erro ao buscar dados do boleto', {
                installmentId,
                errorMessage: error.message
            });
            throw error;
        }
    }
}

module.exports = BoletoRepository;
