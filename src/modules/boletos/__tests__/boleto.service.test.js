const BoletoService = require('../boleto.service');
const { ValidationError } = require('../../../utils/errors');

// Mocks
const mockBoletoRepository = {
    createBoleto: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    getParcelasMovimento: jest.fn()
};

const mockTaskService = {
    createTask: jest.fn()
};

describe('BoletoService', () => {
    let boletoService;

    beforeEach(() => {
        // Limpar todos os mocks antes de cada teste
        jest.clearAllMocks();
        boletoService = new BoletoService(mockBoletoRepository, mockTaskService);
    });

    describe('createBoleto', () => {
        const mockBoletoData = {
            installment_id: 1,
            due_date: '2024-01-01',
            amount: 100,
            payer_id: 1
        };

        it('deve criar um boleto com sucesso', async () => {
            const mockCreatedBoleto = { 
                boleto_id: 1,
                ...mockBoletoData,
                status: 'A Emitir'
            };

            mockBoletoRepository.createBoleto.mockResolvedValue(mockCreatedBoleto);
            mockTaskService.createTask.mockResolvedValue({ task_id: 1 });

            const result = await boletoService.createBoleto(mockBoletoData);

            expect(result.boleto_id).toBe(1);
            expect(result.status).toBe('A Emitir');
            expect(mockTaskService.createTask).toHaveBeenCalledWith(
                'BOLETO_GENERATION',
                expect.any(Object)
            );
        });

        it('deve lançar erro se a criação falhar', async () => {
            mockBoletoRepository.createBoleto.mockRejectedValue(
                new Error('Erro ao criar boleto')
            );

            await expect(
                boletoService.createBoleto(mockBoletoData)
            ).rejects.toThrow('Erro ao criar boleto');
        });
    });

    describe('getBoletoById', () => {
        it('deve retornar um boleto quando encontrado', async () => {
            const mockBoleto = {
                boleto_id: 1,
                status: 'A Emitir'
            };

            mockBoletoRepository.findById.mockResolvedValue(mockBoleto);

            const result = await boletoService.getBoletoById(1);
            expect(result.boleto_id).toBe(1);
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
            {
                installment_id: 1,
                due_date: '2024-01-01',
                amount: 100,
                payer_id: 1
            },
            {
                installment_id: 2,
                due_date: '2024-02-01',
                amount: 100,
                payer_id: 1
            }
        ];

        it('deve emitir boletos para todas as parcelas', async () => {
            mockBoletoRepository.getParcelasMovimento.mockResolvedValue(mockParcelas);
            mockBoletoRepository.createBoleto.mockImplementation(
                data => ({ boleto_id: Math.random(), ...data })
            );

            const result = await boletoService.emitirBoletosMovimento(1);

            expect(result).toHaveLength(2);
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
            boleto_id: 1,
            status: 'A Emitir'
        };

        it('deve cancelar um boleto com sucesso', async () => {
            mockBoletoRepository.findById.mockResolvedValue(mockBoleto);
            mockBoletoRepository.updateStatus.mockImplementation(
                (id, status) => ({ ...mockBoleto, status })
            );

            const result = await boletoService.cancelBoleto(1, 'Teste');
            expect(result.status).toBe('Cancelado');
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
