import { PrismaClient, PersonContact, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class PersonContactRepository {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = prisma;
  }

  async create(data: Prisma.PersonContactCreateInput): Promise<PersonContact> {
    return this.prismaClient.personContact.create({ data });
  }

  async findById(id: string): Promise<PersonContact | null> {
    return this.prismaClient.personContact.findUnique({ 
      where: { id },
      include: {
        person: true,
        contact: true
      }
    });
  }

  async findByPersonAndContact(
    person: string, 
    contactId: string
  ): Promise<PersonContact | null> {
    return this.prismaClient.personContact.findFirst({
      where: {
        person,
        contactId
      }
    });
  }

  async update(
    id: string, 
    data: Prisma.PersonContactUpdateInput
  ): Promise<PersonContact> {
    return this.prismaClient.personContact.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<PersonContact> {
    return this.prismaClient.personContact.delete({
      where: { id }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersonContactWhereUniqueInput;
    where?: Prisma.PersonContactWhereInput;
    orderBy?: Prisma.PersonContactOrderByWithRelationInput;
  }): Promise<PersonContact[]> {
    return this.prismaClient.personContact.findMany({
      ...params,
      include: {
        person: true,
        contact: true
      }
    });
  }

  async count(where?: Prisma.PersonContactWhereInput): Promise<number> {
    return this.prismaClient.personContact.count({ where });
  }
}
