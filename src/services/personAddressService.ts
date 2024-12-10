import { PersonAddress, Prisma } from '@prisma/client';
import { PersonAddressRepository } from '../repositories/personAddressRepository';
import { PersonRepository } from '../repositories/personRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/apiErrors';

export class PersonAddressService {
  private personAddressRepository: PersonAddressRepository;
  private personRepository: PersonRepository;

  constructor() {
    this.personAddressRepository = new PersonAddressRepository();
    this.personRepository = new PersonRepository();
  }

  async createPersonAddress(personAddressData: Prisma.PersonAddressCreateInput): Promise<PersonAddress> {
    // Validações básicas
    if (!personAddressData.person) {
      throw new BadRequestError('Pessoa é obrigatória');
    }

    // Campos obrigatórios
    const requiredFields = [
      'street', 'neighborhood', 'city', 'state', 'zipCode'
    ];
    requiredFields.forEach(field => {
      if (!personAddressData[field]) {
        throw new BadRequestError(`${field} é obrigatório`);
      }
    });

    // Verificar se a pessoa existe
    await this.personRepository.findById(personAddressData.person.connect?.id || '');

    // Se for definido como endereço principal, remover outros endereços principais
    if (personAddressData.isMain) {
      const mainAddress = await this.personAddressRepository.findMainAddressByPersonId(
        personAddressData.person.connect?.id || ''
      );

      if (mainAddress) {
        await this.personAddressRepository.update(mainAddress.id, { isMain: false });
      }
    }

    return this.personAddressRepository.create(personAddressData);
  }

  async getPersonAddressById(id: string): Promise<PersonAddress> {
    const personAddress = await this.personAddressRepository.findById(id);
    
    if (!personAddress) {
      throw new NotFoundError('Endereço não encontrado');
    }

    return personAddress;
  }

  async listPersonAddresses(params: {
    page?: number;
    limit?: number;
    person?: string;
    city?: string;
    state?: string;
  }): Promise<{
    personAddresses: PersonAddress[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, person, city, state } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PersonAddressWhereInput = {};
    if (person) where.person = person;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };

    const [personAddresses, total] = await Promise.all([
      this.personAddressRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' }
      }),
      this.personAddressRepository.count(where)
    ]);

    return {
      personAddresses,
      total,
      page,
      limit
    };
  }

  async updatePersonAddress(
    id: string, 
    personAddressData: Prisma.PersonAddressUpdateInput
  ): Promise<PersonAddress> {
    // Verificar se o endereço existe
    const existingAddress = await this.getPersonAddressById(id);

    // Se for definido como endereço principal, remover outros endereços principais
    if (personAddressData.isMain) {
      const mainAddress = await this.personAddressRepository.findMainAddressByPersonId(
        existingAddress.person
      );

      if (mainAddress && mainAddress.id !== id) {
        await this.personAddressRepository.update(mainAddress.id, { isMain: false });
      }
    }

    return this.personAddressRepository.update(id, personAddressData);
  }

  async deletePersonAddress(id: string): Promise<PersonAddress> {
    // Verificar se o endereço existe
    await this.getPersonAddressById(id);

    return this.personAddressRepository.delete(id);
  }
}
