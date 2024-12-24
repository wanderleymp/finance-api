const { logger } = require('../middlewares/logger');
const { ValidationError } = require('../utils/errors');
const BoletoRepository = require('../modules/boletos/boleto.repository');
const MovementRepository = require('../modules/movements/movement.repository');
const TaskService = require('../modules/tasks/services/task.service');
const n8nService = require('./n8n.service');
const axios = require('axios');

class BoletoService {
    async createBoleto(boletoData) {
        try {
            logger.info('Criando boleto', { boletoData });
            
            const defaultBoletoData = {
                ...boletoData,
                status: 'A Emitir'
            };

            const newBoleto = await BoletoRepository.createBoleto(defaultBoletoData);
            
            // Criar tarefa assíncrona para emissão do boleto
            await TaskService.createTask('BOLETO', newBoleto.boleto_id, {
                boleto_id: newBoleto.boleto_id
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

    async emitirBoletosMovimento(movimentoId) {
        try {
            logger.info('Iniciando emissão de boletos para movimento', { movimentoId });

            // Buscar parcelas do movimento
            const parcelas = await BoletoRepository.getParcelasMovimento(movimentoId);
            if (!parcelas || parcelas.length === 0) {
                throw new ValidationError('Movimento não possui parcelas para emissão de boletos');
            }

            // Criar boletos para cada parcela
            const boletos = [];
            for (const parcela of parcelas) {
                const boletoData = {
                    installment_id: parcela.installment_id,
                    valor: parcela.valor,
                    vencimento: parcela.vencimento,
                    status: 'A Emitir'
                };

                const boleto = await this.createBoleto(boletoData);
                boletos.push(boleto);
            }

            logger.info('Boletos criados com sucesso', { 
                movimentoId,
                quantidadeBoletos: boletos.length
            });

            return boletos;
        } catch (error) {
            logger.error('Erro ao emitir boletos para movimento', {
                movimentoId,
                errorMessage: error.message,
                errorStack: error.stack
            });
            throw error;
        }
    }

    async getBoletoById(boletoId) {
        try {
            const boleto = await BoletoRepository.getBoletoById(boletoId);
            if (!boleto) {
                throw new ValidationError('Boleto não encontrado');
            }
            return boleto;
        } catch (error) {
            logger.error('Erro ao buscar boleto por ID', {
                boletoId,
                errorMessage: error.message
            });
            throw error;
        }
    }

    async emitirBoletoN8N(boleto) {
        try {
            logger.info('Iniciando emissão de boleto via N8N', { 
                boletoId: boleto.boleto_id,
                installmentId: boleto.installment_id
            });

            // Gerar JSON do boleto
            const dadosBoleto = await BoletoRepository.getDadosBoleto(boleto.installment_id);
            if (!dadosBoleto) {
                throw new ValidationError('Dados para geração de boleto não encontrados');
            }

            // Configurar URL do N8N
            const url = 'https://n8n.webhook.agilefinance.com.br/webhook/inter/cobranca/emissao';

            // Preparar payload no formato esperado
            const payload = {
                Dados: {
                    ...dadosBoleto,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                },
                installment_id: boleto.installment_id
            };

            logger.info('Enviando requisição para N8N', { 
                url,
                payload,
                boletoId: boleto.boleto_id,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Enviar requisição para o N8N
            try {
                const response = await axios.post(url, payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                // Verificar resposta
                if (response.status !== 200) {
                    logger.error('Resposta não-200 do N8N', {
                        status: response.status,
                        statusText: response.statusText,
                        data: response.data,
                        boletoId: boleto.boleto_id
                    });
                    throw new Error(`Erro ao emitir boleto: ${response.statusText}`);
                }

                // Atualizar status do boleto
                await BoletoRepository.updateBoletoStatus(boleto.boleto_id, 'Emitido');

                logger.info('Boleto emitido com sucesso via N8N', { 
                    boletoId: boleto.boleto_id,
                    responseData: response.data
                });

                return response.data;
            } catch (axiosError) {
                logger.error('Erro na requisição ao N8N', {
                    url,
                    status: axiosError.response?.status,
                    statusText: axiosError.response?.statusText,
                    data: axiosError.response?.data,
                    boletoId: boleto.boleto_id,
                    error: axiosError.message,
                    stack: axiosError.stack
                });
                throw axiosError;
            }
        } catch (error) {
            logger.error('Erro ao emitir boleto via N8N', {
                boletoId: boleto.boleto_id,
                errorMessage: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async listBoletos(page, limit, filters) {
        try {
            logger.info('Listando boletos', { page, limit, filters });
            return await BoletoRepository.findAll(page, limit, filters);
        } catch (error) {
            logger.error('Erro ao listar boletos', {
                errorMessage: error.message,
                page,
                limit,
                filters
            });
            throw error;
        }
    }

    async processQueue() {
        try {
            logger.info('Processando fila de boletos');

            // Buscar tarefas pendentes do tipo BOLETO
            const tasks = await TaskService.getPendingTasks(10);
            if (!tasks || tasks.length === 0) {
                logger.info('Nenhuma tarefa pendente encontrada');
                return;
            }

            logger.info(`Processando ${tasks.length} tarefas`);

            // Processar cada tarefa
            for (const task of tasks) {
                try {
                    if (task.type_name === 'BOLETO') {
                        const boleto = await this.getBoletoById(task.payload.boleto_id);
                        if (!boleto) {
                            throw new Error(`Boleto ${task.payload.boleto_id} não encontrado`);
                        }

                        await this.emitirBoletoN8N(boleto);
                        await TaskService.updateTaskStatus(task.task_id, 'completed');

                        logger.info('Tarefa processada com sucesso', { 
                            taskId: task.task_id,
                            boletoId: task.payload.boleto_id
                        });
                    }
                } catch (error) {
                    logger.error('Erro ao processar tarefa', {
                        taskId: task.task_id,
                        error: error.message
                    });
                    await TaskService.updateTaskStatus(task.task_id, 'failed', error.message);
                }
            }
        } catch (error) {
            logger.error('Erro ao processar fila de boletos', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
}

module.exports = new BoletoService();
