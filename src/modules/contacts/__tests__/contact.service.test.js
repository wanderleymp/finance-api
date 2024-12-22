const ContactService = require('../contact.service');
const ContactRepository = require('../contact.repository');
const CacheService = require('../../../services/cacheService');

// Mocks
jest.mock('../contact.repository');
jest.mock('../../../services/cacheService');

describe('ContactService', () => {
    let contactService;
    let mockContactRepository;
    let mockCacheService;

    beforeEach(() => {
        mockContactRepository = new ContactRepository();
        mockCacheService = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn()
        };

        contactService = new ContactService({
            contactRepository: mockContactRepository,
            cacheService: mockCacheService
        });
    });

    describe('findAll', () => {
        it('deve buscar contatos do cache se disponível', async () => {
            const mockCachedResult = { data: [], total: 0 };
            mockCacheService.get.mockResolvedValue(mockCachedResult);

            const result = await contactService.findAll({ person_id: 1 });

            expect(mockCacheService.get).toHaveBeenCalled();
            expect(result).toEqual(mockCachedResult);
        });

        it('deve buscar contatos do repositório se cache vazio', async () => {
            const mockResult = { data: [], total: 0 };
            mockCacheService.get.mockResolvedValue(null);
            mockContactRepository.findAll.mockResolvedValue(mockResult);

            const result = await contactService.findAll({ person_id: 1 });

            expect(mockContactRepository.findAll).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('deve retornar contato do cache', async () => {
            const mockContact = { id: 1, contact: '11999999999', type: 'phone' };
            mockCacheService.get.mockResolvedValue(mockContact);

            const result = await contactService.findById(1);

            expect(result).toEqual(mockContact);
        });

        it('deve buscar contato do repositório se cache vazio', async () => {
            const mockContact = { id: 1, contact: '11999999999', type: 'phone' };
            mockCacheService.get.mockResolvedValue(null);
            mockContactRepository.findById.mockResolvedValue(mockContact);

            const result = await contactService.findById(1);

            expect(result).toEqual(mockContact);
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('deve criar contato com validações', async () => {
            const mockContactData = {
                person_id: 1,
                type: 'phone',
                contact: '11999999999'
            };

            const mockCreatedContact = { 
                id: 1, 
                ...mockContactData,
                is_main: true
            };

            mockContactRepository.findMainContactByPersonId.mockResolvedValue(null);
            mockContactRepository.create.mockResolvedValue(mockCreatedContact);

            const result = await contactService.create(mockContactData);

            expect(result).toEqual(mockCreatedContact);
            expect(mockCacheService.delete).toHaveBeenCalled();
        });

        it('deve lançar erro para dados inválidos', async () => {
            const invalidContactData = {
                person_id: 1,
                type: 'invalid', // Tipo inválido
                contact: ''
            };

            await expect(contactService.create(invalidContactData)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('deve atualizar contato existente', async () => {
            const existingContact = { 
                id: 1, 
                person_id: 1, 
                type: 'email',
                contact: 'antigo@example.com' 
            };

            const updateData = {
                contact: 'novo@example.com'
            };

            const updatedContact = { 
                id: 1, 
                ...existingContact, 
                ...updateData 
            };

            mockContactRepository.findById.mockResolvedValue(existingContact);
            mockContactRepository.update.mockResolvedValue(updatedContact);

            const result = await contactService.update(1, updateData);

            expect(result).toEqual(updatedContact);
            expect(mockCacheService.delete).toHaveBeenCalledTimes(3);
        });

        it('deve lançar erro para contato não encontrado', async () => {
            mockContactRepository.findById.mockResolvedValue(null);

            await expect(contactService.update(999, {})).rejects.toThrow('Contato não encontrado');
        });
    });

    describe('delete', () => {
        it('deve deletar contato que não é principal', async () => {
            const existingContact = { 
                id: 1, 
                person_id: 1, 
                type: 'phone',
                contact: '11999999999',
                is_main: false 
            };

            const deletedContact = { ...existingContact };

            mockContactRepository.findById.mockResolvedValue(existingContact);
            mockContactRepository.delete.mockResolvedValue(deletedContact);

            const result = await contactService.delete(1);

            expect(result).toEqual(deletedContact);
            expect(mockCacheService.delete).toHaveBeenCalledTimes(3);
        });

        it('deve lançar erro ao tentar deletar contato principal', async () => {
            const mainContact = { 
                id: 1, 
                person_id: 1, 
                type: 'email',
                contact: 'principal@example.com',
                is_main: true 
            };

            mockContactRepository.findById.mockResolvedValue(mainContact);

            await expect(contactService.delete(1)).rejects.toThrow('Não é possível deletar o contato principal');
        });
    });
});
