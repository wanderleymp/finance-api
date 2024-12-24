const NFSeProcessor = require('../processors/nfse.processor');
const MessageProcessor = require('../processors/message.processor');
const TaskMetrics = require('../monitoring/metrics');

describe('NFSeProcessor', () => {
    let processor;
    let mockTaskService;
    let mockNFSeService;

    beforeEach(() => {
        mockTaskService = {
            updateTaskStatus: jest.fn()
        };

        mockNFSeService = {
            getNFSeById: jest.fn(),
            getEmpresaCredentials: jest.fn(),
            emitirNFSe: jest.fn(),
            markAsFailed: jest.fn()
        };

        processor = new NFSeProcessor(mockTaskService, mockNFSeService);
    });

    it('deve processar uma NFSe com sucesso', async () => {
        // Arrange
        const task = {
            task_id: 1,
            payload: { 
                nfse_id: 123,
                empresa_id: 456
            }
        };

        const nfse = { id: 123 };
        const credentials = { token: 'abc' };

        mockNFSeService.getNFSeById.mockResolvedValue(nfse);
        mockNFSeService.getEmpresaCredentials.mockResolvedValue(credentials);
        mockNFSeService.emitirNFSe.mockResolvedValue({ success: true });

        // Act
        await processor.process(task);

        // Assert
        expect(mockNFSeService.getNFSeById).toHaveBeenCalledWith(123);
        expect(mockNFSeService.getEmpresaCredentials).toHaveBeenCalledWith(456);
        expect(mockNFSeService.emitirNFSe).toHaveBeenCalledWith(nfse, credentials);
        expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(1, 'completed');
    });

    it('deve lidar com credenciais inválidas', async () => {
        // Arrange
        const task = {
            task_id: 1,
            payload: { 
                nfse_id: 123,
                empresa_id: 456
            }
        };

        mockNFSeService.getNFSeById.mockResolvedValue({ id: 123 });
        mockNFSeService.getEmpresaCredentials.mockResolvedValue(null);

        // Act & Assert
        await expect(processor.process(task)).rejects.toThrow('Credenciais não encontradas');
        expect(mockNFSeService.emitirNFSe).not.toHaveBeenCalled();
        expect(mockNFSeService.markAsFailed).toHaveBeenCalled();
    });
});

describe('MessageProcessor', () => {
    let processor;
    let mockTaskService;
    let mockMessageService;

    beforeEach(() => {
        mockTaskService = {
            updateTaskStatus: jest.fn()
        };

        mockMessageService = {
            getMessageById: jest.fn(),
            isChannelAvailable: jest.fn(),
            sendMessage: jest.fn(),
            markAsFailed: jest.fn(),
            notifyError: jest.fn()
        };

        processor = new MessageProcessor(mockTaskService, mockMessageService);
    });

    it('deve enviar mensagem com sucesso', async () => {
        // Arrange
        const task = {
            task_id: 1,
            payload: { 
                message_id: 123,
                channel: 'whatsapp'
            }
        };

        const message = { id: 123, content: 'test' };

        mockMessageService.getMessageById.mockResolvedValue(message);
        mockMessageService.isChannelAvailable.mockResolvedValue(true);
        mockMessageService.sendMessage.mockResolvedValue({ success: true });

        // Act
        await processor.process(task);

        // Assert
        expect(mockMessageService.getMessageById).toHaveBeenCalledWith(123);
        expect(mockMessageService.isChannelAvailable).toHaveBeenCalledWith('whatsapp');
        expect(mockMessageService.sendMessage).toHaveBeenCalledWith(message, 'whatsapp');
        expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(1, 'completed');
    });

    it('deve identificar erros temporários corretamente', () => {
        // Arrange
        const temporaryErrors = [
            new Error('ETIMEDOUT: Connection timed out'),
            new Error('rate limit exceeded'),
            new Error('socket hang up'),
            new Error('ECONNRESET')
        ];

        // Act & Assert
        temporaryErrors.forEach(error => {
            expect(processor.isTemporaryError(error)).toBe(true);
        });

        expect(processor.isTemporaryError(new Error('Invalid credentials'))).toBe(false);
    });

    it('deve identificar erros críticos corretamente', () => {
        // Arrange
        const criticalErrors = [
            new Error('authentication failed'),
            new Error('invalid credentials'),
            new Error('account suspended'),
            new Error('channel not found')
        ];

        // Act & Assert
        criticalErrors.forEach(error => {
            expect(processor.isErrorCritical(error)).toBe(true);
        });

        expect(processor.isErrorCritical(new Error('timeout'))).toBe(false);
    });
});

describe('TaskMetrics', () => {
    beforeEach(() => {
        // Limpar métricas entre testes
        jest.clearAllMocks();
    });

    it('deve registrar métricas corretamente', async () => {
        // Arrange
        const type = 'BOLETO';
        const errorType = 'NETWORK';
        const count = 5;
        const duration = 1.5;

        // Act
        TaskMetrics.recordTaskCreated(type);
        TaskMetrics.recordTaskFailed(type, errorType);
        TaskMetrics.updateTasksPending(type, count);
        TaskMetrics.observeProcessingDuration(type, duration);

        // Assert
        const metrics = await TaskMetrics.collectMetrics();
        expect(metrics.created[type]).toBe(1);
        expect(metrics.failed[type]).toBe(1);
        expect(metrics.pending[type]).toBe(count);
        expect(metrics.avgProcessingTime[type]).toBeCloseTo(duration);
    });

    it('deve calcular taxas e médias corretamente', async () => {
        // Arrange
        const type = 'NFSE';
        
        // Simular 10 tasks: 8 completadas, 2 falhas
        for (let i = 0; i < 8; i++) {
            TaskMetrics.recordTaskCompleted(type);
        }
        for (let i = 0; i < 2; i++) {
            TaskMetrics.recordTaskFailed(type, 'ERROR');
        }

        // Act
        const metrics = await TaskMetrics.collectMetrics();

        // Assert
        expect(metrics.completed[type]).toBe(8);
        expect(metrics.failed[type]).toBe(2);
        // Taxa de falha deve ser 0.2 (2/10)
        const failureRate = metrics.failed[type] / (metrics.completed[type] + metrics.failed[type]);
        expect(failureRate).toBe(0.2);
    });
});
