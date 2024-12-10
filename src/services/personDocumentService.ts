import { PersonDocument, Prisma } from '@prisma/client';
import { PersonDocumentRepository } from '../repositories/personDocumentRepository';
import { PersonRepository } from '../repositories/personRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/apiErrors';
import { validateCPF, validateCNPJ } from '../utils/documentValidation';

export class PersonDocumentService {
  private personDocumentRepository: PersonDocumentRepository;
  private personRepository: PersonRepository;

  constructor() {
    this.personDocumentRepository = new PersonDocumentRepository();
    this.personRepository = new PersonRepository();
  }

  async createPersonDocument(personDocumentData: Prisma.PersonDocumentCreateInput): Promise<PersonDocument> {
    // Validações básicas
    if (!personDocumentData.person) {
      throw new BadRequestError('Pessoa é obrigatória');
    }

    if (!personDocumentData.type || !personDocumentData.number) {
      throw new BadRequestError('Tipo e número do documento são obrigatórios');
    }

    // Verificar se a pessoa existe
    await this.personRepository.findById(personDocumentData.person.connect?.id || '');

    // Validação específica por tipo de documento
    switch (personDocumentData.type) {
      case 'CPF':
        if (!validateCPF(personDocumentData.number)) {
          throw new BadRequestError('CPF inválido');
        }
        break;
      case 'CNPJ':
        if (!validateCNPJ(personDocumentData.number)) {
          throw new BadRequestError('CNPJ inválido');
        }
        break;
    }

    // Verificar se já existe um documento deste tipo para esta pessoa
    const existingDocument = await this.personDocumentRepository.findByPersonAndType(
      personDocumentData.person.connect?.id || '',
      personDocumentData.type
    );

    if (existingDocument) {
      throw new ConflictError(`Documento do tipo ${personDocumentData.type} já existe para esta pessoa`);
    }

    return this.personDocumentRepository.create(personDocumentData);
  }

  async getPersonDocumentById(id: string): Promise<PersonDocument> {
    const personDocument = await this.personDocumentRepository.findById(id);
    
    if (!personDocument) {
      throw new NotFoundError('Documento não encontrado');
    }

    return personDocument;
  }

  async listPersonDocuments(params: {
    page?: number;
    limit?: number;
    person?: string;
    type?: string;
  }): Promise<{
    personDocuments: PersonDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, person, type } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PersonDocumentWhereInput = {};
    if (person) where.person = person;
    if (type) where.type = type as any;

    const [personDocuments, total] = await Promise.all([
      this.personDocumentRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' }
      }),
      this.personDocumentRepository.count(where)
    ]);

    return {
      personDocuments,
      total,
      page,
      limit
    };
  }

  async updatePersonDocument(
    id: string, 
    personDocumentData: Prisma.PersonDocumentUpdateInput
  ): Promise<PersonDocument> {
    // Verificar se o documento existe
    const existingDocument = await this.getPersonDocumentById(id);

    // Validação de número de documento, se for atualizado
    if (personDocumentData.number) {
      switch (existingDocument.type) {
        case 'CPF':
          if (!validateCPF(personDocumentData.number as string)) {
            throw new BadRequestError('CPF inválido');
          }
          break;
        case 'CNPJ':
          if (!validateCNPJ(personDocumentData.number as string)) {
            throw new BadRequestError('CNPJ inválido');
          }
          break;
      }
    }

    return this.personDocumentRepository.update(id, personDocumentData);
  }

  async deletePersonDocument(id: string): Promise<PersonDocument> {
    // Verificar se o documento existe
    await this.getPersonDocumentById(id);

    return this.personDocumentRepository.delete(id);
  }
}
