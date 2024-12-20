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

            // Executar consultas em paralelo
            const [{ rows: [count] }, { rows: data }] = await Promise.all([
                this.pool.query(countQuery, params.slice(0, -2)),
                this.pool.query(query, params)
            ]);

            return {
                data,
                total: parseInt(count.count)
            };
        } catch (error) {
            logger.error('Erro ao buscar boletos', {
                errorMessage: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
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

module.exports = new BoletoRepository();
