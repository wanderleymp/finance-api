const BoletoService = require('../boleto.service');
const { ValidationError } = require('../../../utils/errors');

// Mocks
const mockBoletoRepository = {
    createBoleto: jest.fn(),
    findById: jest.fn(),
    getParcelasMovimento: jest.fn(),
    update: jest.fn()
};

const mockTaskService = {
    createTask: jest.fn()
};

const mockCacheService = {
    generateKey: jest.fn(),
    getOrSet: jest.fn(),
    delete: jest.fn()
};

jest.mock('../boleto.repository', () => {
    return jest.fn().mockImplementation(() => mockBoletoRepository);
});

jest.mock('../../../services/task.service', () => {
    return jest.fn().mockImplementation(() => mockTaskService);
});

jest.mock('../../../services/cache.service', () => {
    return jest.fn().mockImplementation(() => mockCacheService);
});

// TODO: Reativar testes após refatoração dos boletos
describe.skip('BoletoService', () => {
    let boletoService;

    beforeEach(() => {
        jest.clearAllMocks();
        boletoService = new BoletoService();
    });

    describe('createBoleto', () => {
        const mockBoletoData = {
            installment_id: 1,
            due_date: '2024-01-01',
            amount: 100
        };

        it('deve criar um boleto com sucesso', async () => {
            const mockCreatedBoleto = { id: 1, ...mockBoletoData };
            mockBoletoRepository.createBoleto.mockResolvedValue(mockCreatedBoleto);
            mockTaskService.createTask.mockResolvedValue({ id: 1 });

            const result = await boletoService.createBoleto(mockBoletoData);

            expect(result).toEqual(mockCreatedBoleto);
            expect(mockBoletoRepository.createBoleto).toHaveBeenCalledWith(mockBoletoData);
            expect(mockTaskService.createTask).toHaveBeenCalledWith(
                'BOLETO_GENERATION',
                expect.any(Object)
            );
        });

        it('deve lançar erro se a criação falhar', async () => {
            mockBoletoRepository.createBoleto.mockRejectedValue(new Error('Erro ao criar boleto'));

            await expect(
                boletoService.createBoleto(mockBoletoData)
            ).rejects.toThrow('Erro ao criar boleto');
        });
    });

    describe('getBoletoById', () => {
        const mockBoleto = {
            id: 1,
            amount: 100,
            status: 'Emitido'
        };

        beforeEach(() => {
            mockCacheService.generateKey.mockReturnValue('boletos:detail:1');
            mockCacheService.getOrSet.mockImplementation((key, fn) => fn());
        });

        it('deve retornar um boleto quando encontrado', async () => {
            mockBoletoRepository.findById.mockResolvedValue(mockBoleto);

            const result = await boletoService.getBoletoById(1);

            expect(result).toEqual(mockBoleto);
            expect(mockBoletoRepository.findById).toHaveBeenCalledWith(1);
        });

        it('deve lançar ValidationError quando boleto não encontrado', async () => {
            mockBoletoRepository.findById.mockResolvedValue(null);

            await expect(
                boletoService.getBoletoById(1)
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('emitirBoletosMovimento', () => {
        const mockParcelas = [
            { id: 1, amount: 100 },
            { id: 2, amount: 200 }
        ];

        it('deve emitir boletos para todas as parcelas', async () => {
            mockBoletoRepository.getParcelasMovimento.mockResolvedValue(mockParcelas);
            mockBoletoRepository.createBoleto.mockImplementation(data => ({ id: data.installment_id, ...data }));

            await boletoService.emitirBoletosMovimento(1);

            expect(mockBoletoRepository.createBoleto).toHaveBeenCalledTimes(2);
            expect(mockTaskService.createTask).toHaveBeenCalledTimes(2);
        });

        it('deve lançar erro se movimento não tiver parcelas', async () => {
            mockBoletoRepository.getParcelasMovimento.mockResolvedValue([]);

            await expect(
                boletoService.emitirBoletosMovimento(1)
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('cancelBoleto', () => {
        const mockBoleto = {
            id: 1,
            status: 'Emitido'
        };

        it('deve cancelar um boleto com sucesso', async () => {
            mockBoletoRepository.findById.mockResolvedValue(mockBoleto);
            mockBoletoRepository.update.mockResolvedValue({ ...mockBoleto, status: 'Cancelado' });

            await boletoService.cancelBoleto(1, 'Teste de cancelamento');

            expect(mockBoletoRepository.update).toHaveBeenCalledWith(1, {
                status: 'Cancelado',
                cancel_reason: 'Teste de cancelamento'
            });
        });

        it('não deve permitir cancelar boleto já pago', async () => {
            mockBoletoRepository.findById.mockResolvedValue({
                ...mockBoleto,
                status: 'Pago'
            });

            await expect(
                boletoService.cancelBoleto(1, 'Teste')
            ).rejects.toThrow(ValidationError);
        });
    });
});
