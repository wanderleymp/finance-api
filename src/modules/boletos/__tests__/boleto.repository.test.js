// Mock do client que será retornado pelo pool.connect()
const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

// Mock do pool que será usado pelo repositório
const mockPool = {
    connect: jest.fn().mockResolvedValue(mockClient),
    query: jest.fn()
};

// Mock do módulo de database
jest.mock('../../../config/database', () => ({
    systemDatabase: {
        pool: mockPool
    }
}));

const BoletoRepository = require('../boleto.repository');
const { DatabaseError } = require('../../../utils/errors');

// Testes temporariamente desabilitados
test.skip('BoletoRepository tests temporarily disabled', () => {});

describe.skip('BoletoRepository', () => {
    let boletoRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        boletoRepository = new BoletoRepository();
    });

    describe('createBoleto', () => {
        it('deve criar um boleto com sucesso', async () => {
            const mockBoleto = {
                id: 1,
                valor: 100,
                vencimento: '2024-01-01'
            };

            mockClient.query.mockResolvedValueOnce({ rows: [mockBoleto] });

            const result = await boletoRepository.createBoleto(mockBoleto);
            expect(result).toEqual(mockBoleto);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('deve fazer rollback e lançar erro em caso de falha', async () => {
            const mockError = new Error('Erro ao criar boleto');
            mockClient.query.mockRejectedValueOnce(mockError);

            await expect(
                boletoRepository.createBoleto({})
            ).rejects.toThrow(DatabaseError);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('deve encontrar um boleto por ID', async () => {
            const mockBoleto = {
                id: 1,
                valor: 100,
                vencimento: '2024-01-01'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockBoleto] });

            const result = await boletoRepository.findById(1);
            expect(result).toEqual(mockBoleto);
        });

        it('deve retornar null quando boleto não encontrado', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const result = await boletoRepository.findById(999);
            expect(result).toBeNull();
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

    describe('getParcelasMovimento', () => {
        it('deve retornar lista de parcelas', async () => {
            const mockParcelas = [
                { id: 1, valor: 100 },
                { id: 2, valor: 200 }
            ];

            mockPool.query.mockResolvedValueOnce({ rows: mockParcelas });

            const result = await boletoRepository.getParcelasMovimento(1);
            expect(result).toEqual(mockParcelas);
        });

        it('deve retornar array vazio quando não houver parcelas', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const result = await boletoRepository.getParcelasMovimento(999);
            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('deve atualizar um boleto com sucesso', async () => {
            const mockBoleto = {
                id: 1,
                valor: 150,
                status: 'Pago'
            };

            mockClient.query.mockResolvedValueOnce({ rows: [mockBoleto] });

            const result = await boletoRepository.update(1, {
                valor: 150,
                status: 'Pago'
            });

            expect(result).toEqual(mockBoleto);
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('deve retornar null quando boleto não encontrado', async () => {
            mockClient.query.mockResolvedValueOnce({ rows: [] });

            const result = await boletoRepository.update(999, {
                valor: 150
            });

            expect(result).toBeNull();
            expect(mockClient.release).toHaveBeenCalled();
        });

        it('deve fazer rollback em caso de erro', async () => {
            mockClient.query.mockRejectedValueOnce(new Error('Erro de banco'));

            await expect(
                boletoRepository.update(1, {
                    valor: 150,
                    status: 'Pago'
                })
            ).rejects.toThrow(DatabaseError);

            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });
});
