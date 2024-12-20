const logger = require('../middlewares/logger').logger;
const { ValidationError } = require('../utils/errors');
const boletoRepository = require('../repositories/boletoRepository');
const TasksService = require('./tasksService');
const axios = require('axios');

class BoletoService {
    async createBoleto(boletoData) {
        try {
            logger.info('Criando boleto', { boletoData });
            
            const defaultBoletoData = {
                ...boletoData,
                status: 'A Emitir'
            };

            const newBoleto = await boletoRepository.createBoleto(defaultBoletoData);
            
            // Criar tarefa assíncrona para emissão do boleto
            await TasksService.createTask('BOLETO', newBoleto.boleto_id, {
                boleto_id: newBoleto.boleto_id,
                installment_id: newBoleto.installment_id
            });
            
            logger.info('Boleto criado e enfileirado com sucesso', { 
                boletoId: newBoleto.boleto_id 
            });

            return newBoleto;
        } catch (error) {
            logger.error('Erro ao criar boleto', {
                boletoData,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async processQueue() {
        try {
            const pendingItems = await TasksService.getPendingTasks('BOLETO');
            
            for (const item of pendingItems) {
                try {
                    await TasksService.updateTaskStatus(item.task_id, 'processing');
                    
                    const boleto = await boletoRepository.getBoletoById(item.data.boleto_id);
                    await this.emitirBoletoN8N(boleto, item.data.installment_id);
                    
                    await TasksService.updateTaskStatus(item.task_id, 'completed');
                    
                    logger.info('Boleto processado com sucesso', {
                        boletoId: item.data.boleto_id,
                        taskId: item.task_id
                    });
                } catch (error) {
                    logger.error('Erro ao processar boleto da fila', {
                        boletoId: item.data.boleto_id,
                        taskId: item.task_id,
                        error: error.message
                    });
                    
                    await TasksService.updateTaskStatus(
                        item.task_id,
                        'failed',
                        error.message
                    );
                }
            }
        } catch (error) {
            logger.error('Erro ao processar fila de boletos', {
                error: error.message
            });
            throw error;
        }
    }

    async gerarJsonBoleto(installmentId) {
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

            const result = await boletoRepository.pool.query(query, [installmentId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Dados para geração de boleto não encontrados', 'BOLETO_DATA_NOT_FOUND');
            }

            const dadosBoleto = result.rows[0];

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
            const boletoDados = {
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

            logger.info('JSON de boleto gerado com sucesso', { 
                installmentId,
                boletoDados 
            });

            return boletoDados;
        } catch (error) {
            logger.error('Erro ao gerar JSON de boleto', {
                installmentId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async emitirBoletoN8N(boletoDados, installmentId) {
        try {
            // URL completa do webhook
            const n8nUrl = 'https://n8n.webhook.agilefinance.com.br/webhook/inter/cobranca/emissao';
            const n8nApiSecret = process.env.N8N_API_SECRET.trim();
            const n8nApiKey = process.env.N8N_API_KEY.trim();

            logger.info('Configurações de N8N para emissão de boleto', { 
                url: n8nUrl,
                apiSecretPresent: !!n8nApiSecret,
                apiKeyPresent: !!n8nApiKey
            });

            if (!n8nUrl || !n8nApiSecret || !n8nApiKey) {
                throw new Error('Configurações de N8N não definidas completamente');
            }

            // Log de todos os headers e configurações
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${n8nApiSecret}`,
                'X-API-KEY': n8nApiKey,
                'Accept': 'application/json'
            };

            // Validação e normalização dos dados
            const dadosValidados = {
                dados: {
                    seuNumero: boletoDados.seuNumero || '',
                    valorNominal: boletoDados.valorNominal || '0.00',
                    dataVencimento: boletoDados.dataVencimento || '',
                    pagador: {
                        cpfCnpj: boletoDados.pagador?.cpfCnpj || '',
                        tipoPessoa: boletoDados.pagador?.tipoPessoa || '',
                        nome: boletoDados.pagador?.nome || '',
                        endereco: boletoDados.pagador?.endereco || '',
                        numero: boletoDados.pagador?.numero || '',
                        bairro: boletoDados.pagador?.bairro || '',
                        cidade: boletoDados.pagador?.cidade || '',
                        uf: boletoDados.pagador?.uf || '',
                        cep: boletoDados.pagador?.cep || ''
                    },
                    beneficiarioFinal: {
                        cpfCnpj: boletoDados.beneficiarioFinal?.cpfCnpj || '',
                        tipoPessoa: boletoDados.beneficiarioFinal?.tipoPessoa || '',
                        nome: boletoDados.beneficiarioFinal?.nome || '',
                        endereco: boletoDados.beneficiarioFinal?.endereco || '',
                        numero: boletoDados.beneficiarioFinal?.numero || '',
                        bairro: boletoDados.beneficiarioFinal?.bairro || '',
                        cidade: boletoDados.beneficiarioFinal?.cidade || '',
                        uf: boletoDados.beneficiarioFinal?.uf || '',
                        cep: boletoDados.beneficiarioFinal?.cep || ''
                    }
                },
                installment_id: installmentId
            };

            logger.info('Dados validados para emissão de boleto', { 
                dadosValidados: JSON.stringify(dadosValidados, null, 2)
            });

            try {
                const response = await axios.post(n8nUrl, dadosValidados, {
                    headers,
                    timeout: 10000, // 10 segundos de timeout
                    transformRequest: [
                        (data) => {
                            // Garantir que os dados sejam serializados como JSON
                            return JSON.stringify(data);
                        }
                    ]
                });

                logger.info('Resposta da emissão de boleto N8N', {
                    status: response.status,
                    data: response.data
                });

                return response.data;
            } catch (axiosError) {
                // Log detalhado do erro de axios
                logger.error('Erro detalhado na requisição N8N', {
                    errorCode: axiosError.code,
                    errorMessage: axiosError.message,
                    errorResponse: axiosError.response ? {
                        status: axiosError.response.status,
                        data: JSON.stringify(axiosError.response.data, null, 2),
                        headers: axiosError.response.headers
                    } : 'Sem resposta',
                    requestConfig: {
                        url: axiosError.config?.url,
                        method: axiosError.config?.method,
                        headers: Object.keys(axiosError.config?.headers || {}),
                        data: JSON.stringify(axiosError.config?.data, null, 2)
                    }
                });

                throw axiosError;
            }
        } catch (error) {
            logger.error('Erro ao emitir boleto via N8N', {
                errorMessage: error.message,
                errorStack: error.stack,
                boletoDados: JSON.stringify(boletoDados, null, 2)
            });
            throw error;
        }
    }

    async buscarDadosParcela(installmentId) {
        try {
            // Buscar dados da parcela no banco de dados
            const query = `
                SELECT 
                    i.installment_id,
                    i.value,
                    i.due_date,
                    p.name as person_name,
                    p.document as person_document
                FROM 
                    installments i
                JOIN 
                    persons p ON i.person_id = p.person_id
                WHERE 
                    i.installment_id = $1
            `;

            const result = await boletoRepository.pool.query(query, [installmentId]);

            if (result.rows.length === 0) {
                throw new ValidationError('Parcela não encontrada', 'INSTALLMENT_NOT_FOUND');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao buscar dados da parcela', {
                installmentId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async emitirBoletosMovimento(movementId) {
        try {
            // Buscar todas as parcelas do movimento
            const query = `
                SELECT 
                    i.installment_id,
                    i.amount,
                    i.due_date,
                    i.installment_number,
                    m.movement_id
                FROM installments i
                JOIN movement_payments mp ON mp.payment_id = i.payment_id
                JOIN movements m ON m.movement_id = mp.movement_id
                WHERE m.movement_id = $1
                ORDER BY i.installment_number
            `;

            const { rows: installments } = await boletoRepository.pool.query(query, [movementId]);

            if (installments.length === 0) {
                logger.warn('Nenhuma parcela encontrada para o movimento', { movementId });
                return [];
            }

            // Emitir boletos para cada parcela
            const boletosEmitidos = [];
            for (const installment of installments) {
                try {
                    // Gerar JSON do boleto
                    const boletoDados = await this.gerarJsonBoleto(installment.installment_id);
                    
                    // Emitir boleto via N8N
                    const resultadoEmissao = await this.emitirBoletoN8N(boletoDados, installment.installment_id);
                    
                    boletosEmitidos.push({
                        installmentId: installment.installment_id,
                        installmentNumber: installment.installment_number,
                        boletoDados,
                        resultadoEmissao
                    });

                    logger.info('Boleto emitido com sucesso', {
                        movementId,
                        installmentId: installment.installment_id,
                        installmentNumber: installment.installment_number
                    });
                } catch (installmentError) {
                    logger.error('Erro ao emitir boleto para parcela', {
                        movementId,
                        installmentId: installment.installment_id,
                        errorMessage: installmentError.message
                    });
                    
                    // Continuar processando outras parcelas mesmo se uma falhar
                    boletosEmitidos.push({
                        installmentId: installment.installment_id,
                        installmentNumber: installment.installment_number,
                        erro: installmentError.message
                    });
                }
            }

            return boletosEmitidos;
        } catch (error) {
            logger.error('Erro ao emitir boletos do movimento', {
                movementId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async listBoletos(page, limit, filters) {
        try {
            logger.info('Listando boletos', { page, limit, filters });
            
            const result = await boletoRepository.findAll(page, limit, filters);
            
            logger.info('Boletos listados com sucesso', { 
                total: result.total,
                count: result.data.length
            });

            return result;
        } catch (error) {
            logger.error('Erro ao listar boletos', {
                page,
                limit,
                filters,
                errorMessage: error.message
            });
            throw error;
        }
    }
}

module.exports = BoletoService;
