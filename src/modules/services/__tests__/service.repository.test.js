const ServiceRepository = require('../service.repository');
const { systemDatabase } = require('../../../config/database');

describe('ServiceRepository', () => {
    let serviceRepository;

    beforeAll(() => {
        serviceRepository = new ServiceRepository();
    });

    afterAll(async () => {
        await systemDatabase.pool.end();
    });

    describe('findServiceDetails', () => {
        it('deve retornar detalhes completos de um serviço', async () => {
            // Buscar um item de serviço real para teste diretamente na consulta
            const { rows } = await systemDatabase.pool.query(`
                SELECT item_id 
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                LIMIT 1
            `);

            if (rows.length === 0) {
                throw new Error('Nenhum item de serviço encontrado para teste');
            }

            const testItemId = rows[0].item_id;
            const result = await serviceRepository.findServiceDetails(testItemId);

            expect(result).toBeTruthy();
            expect(result).toHaveProperty('item_id', testItemId);
            
            // Verificar campos esperados
            expect(result).toHaveProperty('item_name');
            expect(result).toHaveProperty('item_description');
            expect(result).toHaveProperty('municipality_code');
            expect(result).toHaveProperty('lc116_code');
            expect(result).toHaveProperty('lc116_description');
            expect(result).toHaveProperty('cnae');
        });

        it('deve retornar null para serviço inexistente', async () => {
            const result = await serviceRepository.findServiceDetails(99999);
            expect(result).toBeNull();
        });
    });

    describe('findMultipleServiceDetails', () => {
        it('deve retornar detalhes de múltiplos serviços', async () => {
            // Buscar múltiplos itens de serviço
            const { rows } = await systemDatabase.pool.query(`
                SELECT item_id 
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                LIMIT 3
            `);

            const itemIds = rows.map(row => row.item_id);
            const results = await serviceRepository.findMultipleServiceDetails(itemIds);

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(itemIds.length);
            
            results.forEach(result => {
                expect(result).toHaveProperty('item_id');
                expect(result).toHaveProperty('item_name');
                expect(result).toHaveProperty('cnae');
                expect(result).toHaveProperty('lc116_code');
            });
        });

        it('deve retornar array vazio para lista de IDs vazia', async () => {
            const results = await serviceRepository.findMultipleServiceDetails([]);
            expect(results).toEqual([]);
        });
    });

    describe('Validação de campos', () => {
        it('deve ter todos os campos da view original', async () => {
            // Buscar um item de serviço real para teste
            const { rows } = await systemDatabase.pool.query(`
                SELECT item_id 
                FROM services s
                JOIN items i ON s.item_id = i.item_id
                LIMIT 1
            `);

            if (rows.length === 0) {
                throw new Error('Nenhum item de serviço encontrado para teste');
            }

            const testItemId = rows[0].item_id;
            const result = await serviceRepository.findServiceDetails(testItemId);
            
            const expectedFields = [
                'item_id',
                'item_name',
                'item_description',
                'municipality_code',
                'lc116_code', 
                'lc116_description',
                'cnae'
            ];

            expectedFields.forEach(field => {
                expect(result).toHaveProperty(field);
            });
        });
    });

    describe('Tratamento de erros', () => {
        it('deve lançar erro para input inválido', async () => {
            await expect(serviceRepository.findServiceDetails('invalid')).rejects.toThrow();
            await expect(serviceRepository.findMultipleServiceDetails(['invalid'])).rejects.toThrow();
        });
    });
});
