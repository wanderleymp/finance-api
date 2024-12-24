const TaskModule = require('../task.module');
const TaskService = require('../services/task.service');
const TaskRepository = require('../repositories/task.repository');
const BoletoProcessor = require('../processors/boleto.processor');

describe('TaskModule', () => {
    let taskModule;
    let mockPool;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };

        taskModule = new TaskModule({
            pool: mockPool
        });
    });

    describe('Criação de Tasks', () => {
        it('deve criar uma task com sucesso', async () => {
            // Arrange
            const taskData = {
                type: 'BOLETO',
                payload: { boleto_id: 123 }
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [{ type_id: 1 }] })  // getTaskType
                .mockResolvedValueOnce({ rows: [{ task_id: 1 }] }); // createTask

            // Act
            const result = await taskModule.service.createTask(
                taskData.type,
                taskData.payload
            );

            // Assert
            expect(result.task_id).toBe(1);
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });
    });

    describe('Processamento de Tasks', () => {
        it('deve processar uma task com sucesso', async () => {
            // Arrange
            const task = {
                task_id: 1,
                type_name: 'BOLETO',
                payload: { boleto_id: 123 }
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [{ execution_id: 1 }] })  // createExecution
                .mockResolvedValueOnce({ rows: [{ status: 'COMPLETED' }] }); // updateStatus

            // Act
            await taskModule.worker.processTask(task);

            // Assert
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('deve lidar com falhas no processamento', async () => {
            // Arrange
            const task = {
                task_id: 1,
                type_name: 'BOLETO',
                payload: { boleto_id: 123 }
            };

            const error = new Error('Falha no processamento');

            mockPool.query
                .mockResolvedValueOnce({ rows: [{ execution_id: 1 }] })  // createExecution
                .mockResolvedValueOnce({ rows: [{ status: 'FAILED' }] }); // updateStatus

            const processor = taskModule.worker.getProcessor('BOLETO');
            jest.spyOn(processor, 'process').mockRejectedValue(error);

            // Act
            await taskModule.worker.processTask(task);

            // Assert
            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(processor.process).toHaveBeenCalledWith(task);
        });
    });
});

describe('BoletoProcessor', () => {
    let processor;
    let mockTaskService;
    let mockBoletoService;

    beforeEach(() => {
        mockTaskService = {
            updateTaskStatus: jest.fn()
        };

        mockBoletoService = {
            getBoletoById: jest.fn(),
            emitirBoletoN8N: jest.fn(),
            markAsFailed: jest.fn()
        };

        processor = new BoletoProcessor(mockTaskService, mockBoletoService);
    });

    it('deve processar um boleto com sucesso', async () => {
        // Arrange
        const task = {
            task_id: 1,
            payload: { boleto_id: 123 }
        };

        const boleto = { id: 123 };

        mockBoletoService.getBoletoById.mockResolvedValue(boleto);
        mockBoletoService.emitirBoletoN8N.mockResolvedValue(true);

        // Act
        await processor.process(task);

        // Assert
        expect(mockBoletoService.getBoletoById).toHaveBeenCalledWith(123);
        expect(mockBoletoService.emitirBoletoN8N).toHaveBeenCalledWith(boleto);
        expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(1, 'completed');
    });

    it('deve lidar com boleto não encontrado', async () => {
        // Arrange
        const task = {
            task_id: 1,
            payload: { boleto_id: 123 }
        };

        mockBoletoService.getBoletoById.mockResolvedValue(null);

        // Act & Assert
        await expect(processor.process(task)).rejects.toThrow('Boleto 123 não encontrado');
        expect(mockBoletoService.emitirBoletoN8N).not.toHaveBeenCalled();
        expect(mockBoletoService.markAsFailed).toHaveBeenCalled();
    });
});
