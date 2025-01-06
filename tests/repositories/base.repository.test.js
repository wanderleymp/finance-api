const BaseRepository = require('../../src/repositories/base/BaseRepository');
const { systemDatabase } = require('../../src/config/database');

describe('BaseRepository', () => {
    let baseRepository;
    let mockPool;

    beforeEach(() => {
        // Mock do pool de conexão
        mockPool = {
            query: jest.fn()
        };
        
        // Substituir o pool real pelo mock
        systemDatabase.pool = mockPool;

        // Criar repositório de teste
        baseRepository = new BaseRepository('test_table');
    });

    describe('findAll', () => {
        it('deve gerar query correta com alias de tabela', async () => {
            // Configurar mock de resposta
            mockPool.query
                .mockResolvedValueOnce({
                    rows: [{ id: 1, name: 'Test' }],
                    rowCount: 1
                })
                .mockResolvedValueOnce({
                    rows: [{ total: 1 }]
                });

            // Executar método
            const result = await baseRepository.findAll(1, 10);

            // Verificar chamadas do pool
            expect(mockPool.query).toHaveBeenCalledTimes(2);

            // Extrair a query executada
            const [firstCall] = mockPool.query.mock.calls[0];
            
            // Verificações da query
            expect(firstCall).toContain('WITH subquery AS (');
            expect(firstCall).toContain('FROM test_table');
            expect(firstCall).toContain('ORDER BY created_at DESC');
            expect(firstCall).toContain('LIMIT $1 OFFSET $2');

            // Verificar resultado
            expect(result).toEqual({
                items: [{ id: 1, name: 'Test' }],
                meta: {
                    totalItems: 1,
                    itemCount: 1,
                    itemsPerPage: 10,
                    totalPages: 1,
                    currentPage: 1
                }
            });
        });

        it('deve suportar query personalizada', async () => {
            // Configurar mock de resposta
            mockPool.query
                .mockResolvedValueOnce({
                    rows: [{ id: 1, name: 'Custom' }],
                    rowCount: 1
                })
                .mockResolvedValueOnce({
                    rows: [{ total: 1 }]
                });

            // Executar com query personalizada
            const result = await baseRepository.findAll(1, 10, {}, {
                customQuery: 'SELECT * FROM test_table WHERE status = 1',
                orderBy: 'name ASC'
            });

            // Extrair a query executada
            const [firstCall] = mockPool.query.mock.calls[0];
            
            // Verificações da query
            expect(firstCall).toContain('WITH subquery AS (');
            expect(firstCall).toContain('SELECT * FROM test_table WHERE status = 1');
            expect(firstCall).toContain('ORDER BY name ASC');

            // Verificar resultado
            expect(result.items).toHaveLength(1);
        });

        it('deve tratar erros corretamente', async () => {
            // Configurar erro de banco de dados
            mockPool.query.mockRejectedValue(new Error('Conexão falhou'));

            // Verificar tratamento de erro
            await expect(baseRepository.findAll()).rejects.toThrow('Conexão falhou');
        });
    });
});
