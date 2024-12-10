import { PersonContact, Prisma } from '@prisma/client';
import { PersonContactRepository } from '../repositories/personContactRepository';
import { PersonRepository } from '../repositories/personRepository';
import { ContactRepository } from '../repositories/contactRepository';
import { ApiError } from '../utils/apiErrors';
export class PersonContactService {
    private personContactRepository: PersonContactRepository;
    private personRepository: PersonRepository;
    private contactRepository: ContactRepository;
    constructor() {
        this.personContactRepository = new PersonContactRepository();
        this.personRepository = new PersonRepository();
        this.contactRepository = new ContactRepository();
    }
    async createPersonContact(personContactData: Prisma.PersonContactCreateInput): Promise<PersonContact> {
        // Validações básicas
        if (!personContactData.person || !personContactData.contact) {
            throw new ApiError("Pessoa e contato s\u00E3o obrigat\u00F3rios", 400);
        }
        // Verificar se a pessoa existe
        await this.personRepository.findById(personContactData.person.connect?.id || "");
        // Verificar se o contato existe
        await this.contactRepository.findById(personContactData.contact.connect?.id || "");
        // Verificar se já existe este relacionamento
        const existingPersonContact = await this.personContactRepository.findByPersonAndContact(personContactData.person.connect?.id || "", personContactData.contact.connect?.id || "");
        if (existingPersonContact) {
            throw new ApiError("Relacionamento pessoa-contato j\u00E1 existe", 409);
        }
        return this.personContactRepository.create(personContactData);
    }
    async getPersonContactById(id: string): Promise<PersonContact> {
        const personContact = await this.personContactRepository.findById(id);
        if (!personContact) {
            throw new ApiError("Relacionamento pessoa-contato n\u00E3o encontrado", 404);
        }
        return personContact;
    }
    async updatePersonContact(id: string, personContactData: Prisma.PersonContactUpdateInput): Promise<PersonContact> {
        // Verificar se o relacionamento existe
        await this.getPersonContactById(id);
        return this.personContactRepository.update(id, personContactData);
    }
    async deletePersonContact(id: string): Promise<PersonContact> {
        // Verificar se o relacionamento existe
        await this.getPersonContactById(id);
        return this.personContactRepository.delete(id);
    }
    async findPersonContacts(params?: {
        skip?: number;
        take?: number;
        cursor?: Prisma.PersonContactWhereUniqueInput;
        where?: Prisma.PersonContactWhereInput;
        orderBy?: Prisma.PersonContactOrderByWithRelationInput;
    }): Promise<PersonContact[]> {
        return this.personContactRepository.findAll(params);
    }
}
