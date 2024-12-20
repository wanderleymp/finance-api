const BoletoRepository = require('../boleto.repository');
const { DatabaseError } = require('../../../utils/errors');

// Mock do pool de conexão
const mockPool = {
    connect: jest.fn(),
    query: jest.fn()
};

// Mock do cliente de conexão
const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

jest.mock('../../../config/database', () => ({
    systemDatabase: {
        pool: mockPool
    }
}));

describe('BoletoRepository', () => {
    let boletoRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        boletoRepository = new BoletoRepository();
        mockPool.connect.mockResolvedValue(mockClient);
    });

    describe('createBoleto', () => {
        const mockBoletoData = {
            installment_id: 1,
            due_date: '2024-01-01',
            amount: 100,
            status: 'A Emitir'
        };

        it('deve criar um boleto com sucesso', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [{ boleto_id: 1, ...mockBoletoData }] });

            const result = await boletoRepository.createBoleto(mockBoletoData);

            expect(result.boleto_id).toBe(1);
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('deve fazer rollback em caso de erro', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Erro de banco'));

            await expect(
                boletoRepository.createBoleto(mockBoletoData)
            ).rejects.toThrow(DatabaseError);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('deve retornar lista paginada de boletos', async () => {
            const mockCount = { rows: [{ count: '2' }] };
            const mockBoletos = {
                rows: [
                    { boleto_id: 1, amount: 100 },
                    { boleto_id: 2, amount: 200 }
                ]
            };

            mockPool.query
                .mockResolvedValueOnce(mockCount)
                .mockResolvedValueOnce(mockBoletos);

            const result = await boletoRepository.findAll(1, 10);

            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(result.meta.pages).toBe(1);
        });

        it('deve aplicar filtros corretamente', async () => {
            const filters = {
                status: 'A Emitir',
                start_date: '2024-01-01'
            };

            mockPool.query
                .mockResolvedValueOnce({ rows: [{ count: '1' }] })
                .mockResolvedValueOnce({ rows: [{ boleto_id: 1 }] });

            await boletoRepository.findAll(1, 10, filters);

            const queryCall = mockPool.query.mock.calls[1][0];
            expect(queryCall).toContain('status = $1');
            expect(queryCall).toContain('due_date >= $2');
        });
    });

    describe('findById', () => {
        it('deve retornar um boleto quando encontrado', async () => {
            const mockBoleto = {
                rows: [{
                    boleto_id: 1,
                    amount: 100
                }]
            };

            mockPool.query.mockResolvedValue(mockBoleto);

            const result = await boletoRepository.findById(1);

            expect(result.boleto_id).toBe(1);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.any(String),
                [1]
            );
        });

        it('deve retornar null quando boleto não encontrado', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await boletoRepository.findById(1);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        const mockUpdateData = {
            amount: 150,
            status: 'Emitido'
        };

        it('deve atualizar um boleto com sucesso', async () => {
            mockClient.query.mockResolvedValueOnce({
                rows: [{ boleto_id: 1, ...mockUpdateData }]
            });

            const result = await boletoRepository.update(1, mockUpdateData);

            expect(result.amount).toBe(150);
            expect(result.status).toBe('Emitido');
            expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('deve fazer rollback em caso de erro', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Erro de banco'));

            await expect(
                boletoRepository.update(1, mockUpdateData)
            ).rejects.toThrow(DatabaseError);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('getParcelasMovimento', () => {
        it('deve retornar parcelas do movimento', async () => {
            const mockParcelas = {
                rows: [
                    { installment_id: 1, amount: 100 },
                    { installment_id: 2, amount: 100 }
                ]
            };

            mockPool.query.mockResolvedValue(mockParcelas);

            const result = await boletoRepository.getParcelasMovimento(1);

            expect(result).toHaveLength(2);
            expect(mockPool.query).toHaveBeenCalledWith(
                expect.any(String),
                [1]
            );
        });

        it('deve retornar array vazio quando não houver parcelas', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await boletoRepository.getParcelasMovimento(1);

            expect(result).toHaveLength(0);
        });
    });
});
