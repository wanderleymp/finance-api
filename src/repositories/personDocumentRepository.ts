import { PrismaClient, PersonDocument, Prisma } from '@prisma/client';

export class PersonDocumentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: Prisma.PersonDocumentCreateInput): Promise<PersonDocument> {
    return this.prisma.personDocument.create({ 
      data,
      include: {
        person: true
      }
    });
  }

  async findById(id: string): Promise<PersonDocument | null> {
    return this.prisma.personDocument.findUnique({ 
      where: { id },
      include: {
        person: true
      }
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersonDocumentWhereUniqueInput;
    where?: Prisma.PersonDocumentWhereInput;
    orderBy?: Prisma.PersonDocumentOrderByWithRelationInput;
  }): Promise<PersonDocument[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.personDocument.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        person: true
      }
    });
  }

  async update(id: string, data: Prisma.PersonDocumentUpdateInput): Promise<PersonDocument> {
    return this.prisma.personDocument.update({
      where: { id },
      data,
      include: {
        person: true
      }
    });
  }

  async delete(id: string): Promise<PersonDocument> {
    return this.prisma.personDocument.delete({
      where: { id }
    });
  }

  async count(where?: Prisma.PersonDocumentWhereInput): Promise<number> {
    return this.prisma.personDocument.count({ where });
  }

  async findByPersonAndType(person: string, type: string): Promise<PersonDocument | null> {
    return this.prisma.personDocument.findUnique({
      where: { 
        person_type_number: { 
          person, 
          type: type as any,
          number: '' // Placeholder, será substituído na implementação
        } 
      }
    });
  }
}
