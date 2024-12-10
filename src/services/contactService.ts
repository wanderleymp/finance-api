import { Contact, Prisma } from '@prisma/client';
import { ContactRepository } from '../repositories/contactRepository';
import { ApiError } from '../utils/apiErrors';

export class ContactService {
  private contactRepository: ContactRepository;

  constructor() {
    this.contactRepository = new ContactRepository();
  }

  async createContact(data: Prisma.ContactCreateInput): Promise<Contact> {
    // Validações básicas
    if (!data.type || !data.value) {
      throw new ApiError('Tipo e valor do contato são obrigatórios', 400);
    }

    // Verificar se já existe um contato com o mesmo tipo e valor
    const existingContact = await this.contactRepository.findByTypeAndValue(
      data.type,
      data.value
    );

    if (existingContact) {
      throw new ApiError('Contato já existe', 409);
    }

    return this.contactRepository.create(data);
  }

  async getContactById(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findById(id);
    
    if (!contact) {
      throw new ApiError('Contato não encontrado', 404);
    }

    return contact;
  }

  async listContacts(params: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<{
    contacts: Contact[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, type } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = type 
      ? { type: type as any } 
      : {};

    const [contacts, total] = await Promise.all([
      this.contactRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { type: 'asc' }
      }),
      this.contactRepository.count(where)
    ]);

    return {
      contacts,
      total,
      page,
      limit
    };
  }

  async updateContact(
    id: string, 
    contactData: Prisma.ContactUpdateInput
  ): Promise<Contact> {
    // Verificar se o contato existe
    await this.getContactById(id);

    // Se estiver atualizando tipo ou valor, verificar conflitos
    if (contactData.type || contactData.value) {
      const existingContact = await this.contactRepository.findByTypeAndValue(
        contactData.type as string, 
        contactData.value as string
      );

      if (existingContact && existingContact.id !== id) {
        throw new ApiError('Contato com este tipo e valor já existe', 409);
      }
    }

    return this.contactRepository.update(id, contactData);
  }

  async deleteContact(id: string): Promise<Contact> {
    // Verificar se o contato existe
    await this.getContactById(id);

    return this.contactRepository.delete(id);
  }

  async findContacts(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ContactWhereUniqueInput;
    where?: Prisma.ContactWhereInput;
    orderBy?: Prisma.ContactOrderByWithRelationInput;
  }): Promise<Contact[]> {
    const processedParams = {
      ...params,
      where: {
        ...params?.where,
        value: params?.where?.value 
          ? { contains: params.where.value as string, mode: 'insensitive' } 
          : undefined
      }
    };

    return this.contactRepository.findAll(processedParams);
  }

  async countContacts(where?: Prisma.ContactWhereInput): Promise<number> {
    return this.contactRepository.count(where);
  }
}
