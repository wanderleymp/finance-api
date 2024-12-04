const ProcessService = require('../services/ProcessService');
const logger = require('../../config/logger');

class ProcessController {
    /**
     * Cria um novo processo
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    async createProcess(req, res) {
        try {
            const { 
                process_type_id, 
                reference_table, 
                reference_id, 
                additional_data 
            } = req.body;

            // Validações básicas
            if (!process_type_id || !reference_table || !reference_id) {
                return res.status(400).json({ 
                    error: 'Parâmetros obrigatórios não fornecidos' 
                });
            }

            // Cria o processo
            const result = await ProcessService.createProcess(
                process_type_id, 
                reference_table, 
                reference_id, 
                additional_data
            );

            // Inicia o processo automaticamente
            const startedProcess = await ProcessService.startProcess(
                result.process.process_id
            );

            // Log da criação do processo
            logger.info('Processo criado com sucesso', { 
                processId: result.process.process_id,
                processTypeId: process_type_id,
                referenceTable: reference_table,
                referenceId: reference_id
            });

            res.status(201).json({
                message: 'Processo criado com sucesso',
                process: startedProcess,
                tasks: result.tasks
            });
        } catch (error) {
            logger.error('Erro ao criar processo', { 
                error: error.message,
                body: req.body
            });

            res.status(500).json({ 
                error: 'Erro ao criar processo', 
                details: error.message 
            });
        }
    }

    /**
     * Executa uma tarefa de processo
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    async executeProcessTask(req, res) {
        try {
            const { process_task_id } = req.params;
            const execution_data = req.body;

            // Executa a tarefa
            const updatedTask = await ProcessService.executeProcessTask(
                parseInt(process_task_id), 
                execution_data
            );

            // Log da execução da tarefa
            logger.info('Tarefa de processo executada', { 
                processTaskId: process_task_id,
                status: updatedTask.status
            });

            res.json({
                message: 'Tarefa executada com sucesso',
                task: updatedTask
            });
        } catch (error) {
            logger.error('Erro ao executar tarefa de processo', { 
                error: error.message,
                processTaskId: req.params.process_task_id
            });

            res.status(500).json({ 
                error: 'Erro ao executar tarefa de processo', 
                details: error.message 
            });
        }
    }

    /**
     * Busca processos
     * @param {Object} req - Requisição Express
     * @param {Object} res - Resposta Express
     */
    async listProcesses(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                process_type_id 
            } = req.query;

            const prisma = new (require('@prisma/client').PrismaClient)();

            // Constrói filtros
            const where = {};
            if (status) where.status = status;
            if (process_type_id) where.process_type_id = parseInt(process_type_id);

            // Busca processos
            const processes = await prisma.processes.findMany({
                where,
                include: {
                    process_types: true,
                    process_tasks: true
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' }
            });

            // Contagem total
            const total = await prisma.processes.count({ where });

            res.json({
                data: processes,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            logger.error('Erro ao listar processos', { 
                error: error.message 
            });

            res.status(500).json({ 
                error: 'Erro ao listar processos', 
                details: error.message 
            });
        }
    }
}

module.exports = new ProcessController();
