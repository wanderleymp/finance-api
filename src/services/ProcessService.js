const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');

class ProcessService {
    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * Valida o tipo de processo
     * @param {number} processTypeId 
     * @returns {Promise<boolean>}
     */
    async validateProcessType(processTypeId) {
        try {
            const processType = await this.prisma.process_types.findUnique({
                where: { process_type_id: processTypeId }
            });
            return !!processType;
        } catch (error) {
            logger.error('Erro ao validar tipo de processo', { 
                processTypeId, 
                error: error.message 
            });
            throw new Error('Falha ao validar tipo de processo');
        }
    }

    /**
     * Verifica se o registro de referência existe
     * @param {string} referenceTable 
     * @param {number} referenceId 
     * @returns {Promise<boolean>}
     */
    async validateReferenceRecord(referenceTable, referenceId) {
        try {
            // Mapeamento de tabelas para modelos do Prisma
            const tableModelMap = {
                'movements': 'movements',
                'sales': 'movements',
                'purchases': 'movements'
            };

            const modelName = tableModelMap[referenceTable];
            if (!modelName) {
                throw new Error('Tabela de referência não suportada');
            }

            const record = await this.prisma[modelName].findUnique({
                where: { 
                    movement_id: referenceId,
                    movement_type_id: referenceTable === 'sales' ? 1 : 2 
                }
            });

            return !!record;
        } catch (error) {
            logger.error('Erro ao validar registro de referência', { 
                referenceTable, 
                referenceId, 
                error: error.message 
            });
            throw new Error('Falha ao validar registro de referência');
        }
    }

    /**
     * Cria as tarefas padrão para um processo
     * @param {number} processId 
     * @param {number} processTypeId 
     * @returns {Promise<Array>}
     */
    async createProcessTasks(processId, processTypeId) {
        try {
            // Busca tarefas padrão para o tipo de processo
            const defaultTasks = await this.prisma.process_type_tasks.findMany({
                where: { process_type_id: processTypeId },
                orderBy: { order: 'asc' }
            });

            // Cria tarefas do processo
            const processTasks = await Promise.all(
                defaultTasks.map(async (taskTemplate) => {
                    const processTask = await this.prisma.process_tasks.create({
                        data: {
                            process_id: processId,
                            task_name: taskTemplate.task_name,
                            description: taskTemplate.description,
                            status: 'pending',
                            order: taskTemplate.order
                        }
                    });

                    // Registra log da criação da tarefa
                    await this.createProcessLog(
                        processId, 
                        `Tarefa criada: ${taskTemplate.task_name}`, 
                        'task_creation'
                    );

                    return processTask;
                })
            );

            return processTasks;
        } catch (error) {
            logger.error('Erro ao criar tarefas do processo', { 
                processId, 
                processTypeId, 
                error: error.message 
            });
            throw new Error('Falha ao criar tarefas do processo');
        }
    }

    /**
     * Cria um novo processo
     * @param {number} processTypeId 
     * @param {string} referenceTable 
     * @param {number} referenceId 
     * @param {Object} additionalData 
     * @returns {Promise<Object>}
     */
    async createProcess(processTypeId, referenceTable, referenceId, additionalData = {}) {
        // Inicia uma transação
        return this.prisma.$transaction(async (tx) => {
            // Valida tipo de processo
            const isValidProcessType = await this.validateProcessType(processTypeId);
            if (!isValidProcessType) {
                throw new Error('Tipo de processo inválido');
            }

            // Valida registro de referência
            const isValidReference = await this.validateReferenceRecord(referenceTable, referenceId);
            if (!isValidReference) {
                throw new Error('Registro de referência inválido');
            }

            // Cria o processo
            const process = await tx.processes.create({
                data: {
                    process_type_id: processTypeId,
                    reference_table: referenceTable,
                    reference_id: referenceId,
                    status: 'pending',
                    additional_data: JSON.stringify(additionalData)
                }
            });

            // Cria tarefas do processo
            const processTasks = await this.createProcessTasks(process.process_id, processTypeId);

            // Registra log de criação do processo
            await this.createProcessLog(
                process.process_id, 
                `Processo criado para ${referenceTable} #${referenceId}`, 
                'process_creation'
            );

            return {
                process,
                tasks: processTasks
            };
        });
    }

    /**
     * Inicia um processo
     * @param {number} processId 
     * @returns {Promise<Object>}
     */
    async startProcess(processId) {
        try {
            // Atualiza status do processo
            const process = await this.prisma.processes.update({
                where: { process_id: processId },
                data: { 
                    status: 'running',
                    started_at: new Date()
                }
            });

            // Registra log de início do processo
            await this.createProcessLog(
                processId, 
                'Processo iniciado', 
                'process_start'
            );

            return process;
        } catch (error) {
            logger.error('Erro ao iniciar processo', { 
                processId, 
                error: error.message 
            });
            throw new Error('Falha ao iniciar processo');
        }
    }

    /**
     * Cria um log de processo
     * @param {number} processId 
     * @param {string} message 
     * @param {string} logType 
     * @returns {Promise<Object>}
     */
    async createProcessLog(processId, message, logType = 'info') {
        try {
            return await this.prisma.process_logs.create({
                data: {
                    process_id: processId,
                    message,
                    log_type: logType
                }
            });
        } catch (error) {
            console.error('Erro ao criar log de processo', { 
                processId, 
                message, 
                logType, 
                error: error.message 
            });
            // Não lança erro para não interromper fluxo principal
            return null;
        }
    }

    /**
     * Executa uma tarefa do processo
     * @param {number} processTaskId 
     * @param {Object} executionData 
     * @returns {Promise<Object>}
     */
    async executeProcessTask(processTaskId, executionData = {}) {
        return this.prisma.$transaction(async (tx) => {
            // Busca a tarefa
            const task = await tx.process_tasks.findUnique({
                where: { process_task_id: processTaskId },
                include: { processes: true }
            });

            if (!task) {
                throw new Error('Tarefa não encontrada');
            }

            // Atualiza status da tarefa
            const updatedTask = await tx.process_tasks.update({
                where: { process_task_id: processTaskId },
                data: {
                    status: 'completed',
                    completed_at: new Date(),
                    execution_data: JSON.stringify(executionData)
                }
            });

            // Registra log da tarefa
            await this.createProcessLog(
                task.process_id, 
                `Tarefa completada: ${task.task_name}`, 
                'task_completion'
            );

            // Verifica se todas as tarefas estão completas
            const remainingTasks = await tx.process_tasks.count({
                where: { 
                    process_id: task.process_id, 
                    status: 'pending' 
                }
            });

            // Se não há tarefas pendentes, completa o processo
            if (remainingTasks === 0) {
                await tx.processes.update({
                    where: { process_id: task.process_id },
                    data: { 
                        status: 'completed',
                        completed_at: new Date() 
                    }
                });

                // Registra log de conclusão do processo
                await this.createProcessLog(
                    task.process_id, 
                    'Processo concluído', 
                    'process_completion'
                );
            }

            return updatedTask;
        });
    }
}

module.exports = new ProcessService();
