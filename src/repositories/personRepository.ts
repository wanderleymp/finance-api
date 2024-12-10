import { Repository, DataSource, Like, FindOptionsWhere } from 'typeorm';
import { Persons } from '../entities/Persons';
import { AppDataSource } from '../config/typeorm';

export class PersonRepository {
  private repository: Repository<Persons>;

  constructor() {
    this.repository = AppDataSource.getRepository(Persons);
  }

  async create(data: Partial<Persons>): Promise<Persons> {
    const person = this.repository.create(data);
    return this.repository.save(person);
  }

  async findById(id: number): Promise<Persons | null> {
    return this.repository.findOne({ 
      where: { person_id: id } 
    });
  }

  async findAll(options: {
    skip?: number;
    take?: number;
    order?: { [key: string]: 'ASC' | 'DESC' };
    where?: FindOptionsWhere<Persons>;
  } = {}): Promise<Persons[]> {
    return this.repository.find({
      skip: options.skip || 0,
      take: options.take || 10,
      order: options.order || { created_at: 'DESC' },
      where: options.where
    });
  }

  async update(id: number, data: Partial<Persons>): Promise<Persons | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== 0;
  }

  async count(where?: FindOptionsWhere<Persons>): Promise<number> {
    return this.repository.count({ where });
  }

  async findByDocument(documentNumber: string): Promise<Persons | null> {
    return this.repository.findOne({
      where: {
        documents: {
          some: {
            number: documentNumber
          }
        }
      }
    });
  }

  async findByContact(contact: string): Promise<Persons | null> {
    return this.repository.createQueryBuilder('person')
      .innerJoin('person.contacts', 'contact')
      .where('contact.value = :contact', { contact })
      .getOne();
  }

  async findByCnpj(cnpj: string): Promise<Persons | null> {
    return this.repository.createQueryBuilder('person')
      .innerJoin('person.documents', 'document')
      .where('document.number = :cnpj AND document.type = "CNPJ"', { cnpj })
      .getOne();
  }

  async saveOrUpdateByCnpj(cnpj: string, personData: Partial<Persons>): Promise<Persons> {
    const existingPerson = await this.findByCnpj(cnpj);

    if (existingPerson) {
      return this.update(existingPerson.person_id, personData);
    } else {
      return this.create({
        ...personData,
      });
    }
  }

  async findByName(name: string, options: {
    exact?: boolean;
    limit?: number;
  } = {}): Promise<Persons[]> {
    const { exact = false, limit = 10 } = options;

    const whereCondition = exact 
      ? { full_name: name }
      : { full_name: Like(`%${name}%`) };

    return this.repository.find({
      where: whereCondition,
      take: limit
    });
  }
}
