const BaseProcessor = require('./base.processor');
const { logger } = require('../../../middlewares/logger');

class NFSeProcessor extends BaseProcessor {
    constructor(taskService, nfseService) {
        super(taskService);
        this.nfseService = nfseService;
    }

    getTaskType() {
        return 'NFSE';
    }

    async validatePayload(payload) {
        if (!payload.nfse_id) {
            throw new Error('nfse_id é obrigatório');
        }
        if (!payload.empresa_id) {
            throw new Error('empresa_id é obrigatório');
        }
    }

    async process(task) {
        const { nfse_id, empresa_id } = task.payload;
        
        try {
            // Buscar NFSe
            const nfse = await this.nfseService.getNFSeById(nfse_id);
            if (!nfse) {
                throw new Error(`NFSe ${nfse_id} não encontrada`);
            }

            // Buscar credenciais da empresa
            const credentials = await this.nfseService.getEmpresaCredentials(empresa_id);
            if (!credentials) {
                throw new Error(`Credenciais não encontradas para empresa ${empresa_id}`);
            }

            // Emitir NFSe
            const result = await this.nfseService.emitirNFSe(nfse, credentials);

            // Atualizar status
            await this.updateTaskStatus(task.task_id, 'completed');

            logger.info('NFSe processada com sucesso', {
                taskId: task.task_id,
                nfseId: nfse_id,
                empresaId: empresa_id
            });

            return result;
        } catch (error) {
            // Registrar erro
            await this.handleFailure(task, error);
            
            // Propagar erro
            throw error;
        }
    }

    async handleFailure(task, error) {
        await super.handleFailure(task, error);
        
        // Marcar NFSe como falha
        await this.nfseService.markAsFailed(
            task.payload.nfse_id,
            error.message
        );
    }

    async canRetry(task) {
        // Não tentar novamente se for erro de credenciais ou NFSe não encontrada
        if (error.message.includes('Credenciais não encontradas') ||
            error.message.includes('NFSe não encontrada')) {
            return false;
        }

        // Tentar novamente para outros erros
        return task.retries < task.max_retries;
    }
}

module.exports = NFSeProcessor;
