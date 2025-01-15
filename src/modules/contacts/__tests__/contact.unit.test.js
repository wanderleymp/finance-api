const ContactRepository = require('../contact.repository');
const ContactService = require('../contact.service');
const ContactValidator = require('../validators/contact.validator');

describe('Contact Unit Tests', () => {
    let mockPool;
    let contactRepository;
    let contactService;

    beforeEach(() => {
        mockPool = {
            query: jest.fn()
        };

        contactRepository = new ContactRepository();
        contactRepository.pool = mockPool;

        contactService = new ContactService({
            contactRepository,
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn()
            }
        });
    });

    describe('ContactRepository', () => {
        it('deve criar um contato', async () => {
            const mockContact = { 
                id: 1, 
                type: 'email', 
                contact: 'teste@exemplo.com',
                person_id: 1 
            };

            mockPool.query.mockResolvedValue({ rows: [mockContact] });

            const result = await contactRepository.create(mockContact);
            
            expect(result).toEqual(mockContact);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve atualizar um contato', async () => {
            const mockContact = { 
                id: 1, 
                contact: 'novo_teste@exemplo.com' 
            };

            mockPool.query.mockResolvedValue({ rows: [mockContact] });

            const result = await contactRepository.update(1, mockContact);
            
            expect(result).toEqual(mockContact);
            expect(mockPool.query).toHaveBeenCalled();
        });

        it('deve buscar contatos por pessoa', async () => {
            const mockContacts = [
                { id: 1, type: 'email', contact: 'teste1@exemplo.com', person_id: 1 },
                { id: 2, type: 'phone', contact: '1234567890', person_id: 1 }
            ];

            mockPool.query.mockResolvedValue({ rows: mockContacts });

            const result = await contactRepository.findByPersonId(1);
            
            expect(result).toEqual(mockContacts);
            expect(mockPool.query).toHaveBeenCalled();
        });
    });

    describe('ContactService', () => {
        it('deve criar um contato', async () => {
            const mockContact = { 
                type: 'email', 
                contact: 'teste@exemplo.com',
                person_id: 1 
            };

            const mockCreatedContact = { 
                ...mockContact, 
                id: 1 
            };

            contactRepository.create = jest.fn().mockResolvedValue(mockCreatedContact);

            const result = await contactService.create(mockContact);
            
            expect(result).toEqual(mockCreatedContact);
            expect(contactRepository.create).toHaveBeenCalledWith(mockContact);
        });

        it('deve atualizar um contato', async () => {
            const mockContact = { 
                contact: 'novo_teste@exemplo.com' 
            };

            const mockUpdatedContact = { 
                id: 1, 
                ...mockContact 
            };

            contactRepository.update = jest.fn().mockResolvedValue(mockUpdatedContact);

            const result = await contactService.update(1, mockContact);
            
            expect(result).toEqual(mockUpdatedContact);
            expect(contactRepository.update).toHaveBeenCalledWith(1, mockContact);
        });
    });

    describe('ContactValidator', () => {
        it('deve validar email corretamente', () => {
            expect(ContactValidator.validateEmail('teste@exemplo.com')).toBe(true);
            expect(ContactValidator.validateEmail('teste.email@exemplo.com.br')).toBe(true);
            expect(ContactValidator.validateEmail('teste@exemplo')).toBe(false);
            expect(ContactValidator.validateEmail('teste@.com')).toBe(false);
        });

        it('deve validar telefone corretamente', () => {
            expect(ContactValidator.validatePhone('1234567890')).toBe(true);
            expect(ContactValidator.validatePhone('+551234567890')).toBe(true);
            expect(ContactValidator.validatePhone('123456')).toBe(false);
            expect(ContactValidator.validatePhone('abcdefghij')).toBe(false);
        });
    });
});
