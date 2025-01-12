const ServiceRepository = require('../service.repository');
const ServiceValidator = require('../validators/service.validator');
const { systemDatabase } = require('../../../config/database');

describe('ServiceRepository', () => {
    let serviceRepository;
    let mockPool;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };
        systemDatabase.pool = mockPool;
        serviceRepository = new ServiceRepository();
    });

    describe('create', () => {
        it('deve criar um serviço com sucesso', async () => {
            const mockServiceData = {
                itemId: 1,
                serviceGroupId: 2,
                description: 'Serviço de Teste',
                name: 'Teste'
            };

            mockPool.query.mockResolvedValueOnce({
                rows: [{ 
                    ...mockServiceData, 
                    service_id: 1,
                    created_at: new Date(),
                    updated_at: new Date()
                }]
            });

            const result = await serviceRepository.create(mockServiceData);

            expect(result).toHaveProperty('service_id');
            expect(result.description).toBe(mockServiceData.description);
        });
    });

    describe('findAll', () => {
        it('deve buscar serviços com paginação', async () => {
            mockPool.query
                .mockResolvedValueOnce({
                    rows: [{ 
                        service_id: 1, 
                        description: 'Serviço 1',
                        total_count: 10
                    }]
                })
                .mockResolvedValueOnce({
                    rows: [{ total: 10 }]
                });

            const result = await serviceRepository.findAll({}, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(10);
        });
    });
});
