const ContactRepository = require('../contact.repository');
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

describe('ContactRepository', () => {
    let contactRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        contactRepository = new ContactRepository();
    });

    describe('findAll', () => {
        it('deve buscar contatos com paginação', async () => {
            const mockContacts = [
                { 
                    contact_id: 1, 
                    person_id: 1, 
                    type: 'phone', 
                    contact: '11999999999',
                    is_main: true
                }
            ];

            const mockTotal = [{ total: 1 }];

            mockPool.query
                .mockResolvedValueOnce({ rows: mockContacts })
                .mockResolvedValueOnce({ rows: mockTotal });

            const result = await contactRepository.findAll({ person_id: 1 }, 1, 10);

            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });
    });

    describe('findById', () => {
        it('deve buscar contato por ID', async () => {
            const mockContact = { 
                contact_id: 1, 
                person_id: 1, 
                type: 'email', 
                contact: 'teste@example.com'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockContact] });

            const result = await contactRepository.findById(1);

            expect(result.id).toBe(1);
            expect(result.contact).toBe('teste@example.com');
        });

        it('deve retornar null se contato não encontrado', async () => {
            mockPool.query.mockResolvedValueOnce({ rows: [] });

            const result = await contactRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('deve criar um novo contato', async () => {
            const mockContact = { 
                contact_id: 1, 
                person_id: 1, 
                type: 'phone', 
                contact: '11999999999',
                is_main: true,
                is_active: true
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockContact] });

            const result = await contactRepository.create(mockContact);

            expect(result.id).toBe(1);
            expect(result.contact).toBe('11999999999');
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });

    describe('update', () => {
        it('deve atualizar um contato', async () => {
            const mockContact = { 
                contact_id: 1, 
                contact: '11988888888',
                type: 'phone'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockContact] });

            const result = await contactRepository.update(1, mockContact);

            expect(result.contact).toBe('11988888888');
        });
    });

    describe('delete', () => {
        it('deve deletar um contato', async () => {
            const mockContact = { 
                contact_id: 1, 
                person_id: 1, 
                type: 'email',
                contact: 'teste@example.com'
            };

            mockPool.query.mockResolvedValueOnce({ rows: [mockContact] });

            const result = await contactRepository.delete(1);

            expect(result.id).toBe(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
        });
    });
});
