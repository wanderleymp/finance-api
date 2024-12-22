const AddressRepository = require('../address.repository');
const { systemDatabase } = require('../../../config/database');

// Mock do pool
const mockPool = {
    query: jest.fn()
};

// Mock do módulo de database
jest.mock('../../../config/database', () => ({
    systemDatabase: {
        pool: mockPool
    }
}));

describe('AddressRepository', () => {
    let addressRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        addressRepository = new AddressRepository();
    });

    describe('findAll', () => {
        it('deve buscar endereços com paginação', async () => {
            const mockAddresses = [
                { 
                    address_id: 1, 
                    person_id: 1, 
                    street: 'Rua Teste', 
                    city: 'São Paulo',
                    state: 'SP'
                }
            ];

            const mockTotal = [{ total: 1 }];

            mockPool.query
                .mockResolvedValueOnce({ rows: mockAddresses })
                .mockResolvedValueOnce({ rows: mockTotal });

            const result = await addressRepository.findAll({ person_id: 1 }, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });
    });

    describe('findById', () => {
        it('deve buscar endereço por ID', async () => {
            const mockAddress = { 
                address_id: 1, 
                person_id: 1, 
                street: 'Rua Teste', 
                city: 'São Paulo',
                state: 'SP'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await addressRepository.findById(1);

            expect(result.id).toBe(1);
            expect(result.street).toBe('Rua Teste');
        });

        it('deve retornar null se endereço não encontrado', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const result = await addressRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('deve criar um novo endereço', async () => {
            const mockAddress = { 
                address_id: 1, 
                person_id: 1, 
                street: 'Rua Teste', 
                number: '100',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                postal_code: '01000-000',
                is_main: true
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await addressRepository.create(mockAddress);

            expect(result.id).toBe(1);
            expect(result.street).toBe('Rua Teste');
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });

    describe('update', () => {
        it('deve atualizar um endereço', async () => {
            const mockAddress = { 
                address_id: 1, 
                street: 'Rua Atualizada', 
                city: 'Rio de Janeiro'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await addressRepository.update(1, mockAddress);

            expect(result.street).toBe('Rua Atualizada');
            expect(result.city).toBe('Rio de Janeiro');
        });
    });

    describe('delete', () => {
        it('deve deletar um endereço', async () => {
            const mockAddress = { 
                address_id: 1, 
                person_id: 1, 
                street: 'Rua Teste'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockAddress] });

            const result = await addressRepository.delete(1);

            expect(result.id).toBe(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });
});
