import { PrismaClient, Contact, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

export class ContactRepository {
  private prismaClient: PrismaClient;

  constructor() {
    this.prismaClient = prisma;
  }

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prismaClient.contact.create({ 
      data,
      include: {
        personContacts: {
          include: { person: true }
        }
      }
    });
  }

  async findById(id: string): Promise<Contact | null> {
    return this.prismaClient.contact.findUnique({ 
      where: { id },
      include: {
        personContacts: {
          include: { person: true }
        }
      }
    });
  }

  async findByTypeAndValue(
    type: string, 
    value: string
  ): Promise<Contact | null> {
    return this.prismaClient.contact.findFirst({
      where: { 
        type,
        value
      }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ContactWhereUniqueInput;
    where?: Prisma.ContactWhereInput;
    orderBy?: Prisma.ContactOrderByWithRelationInput;
  }): Promise<Contact[]> {
    return this.prismaClient.contact.findMany({
      ...params,
      include: {
        personContacts: {
          include: { person: true }
        }
      }
    });
  }

  async update(
    id: string, 
    data: Prisma.ContactUpdateInput
  ): Promise<Contact> {
    return this.prismaClient.contact.update({
      where: { id },
      data,
      include: {
        personContacts: {
          include: { person: true }
        }
      }
    });
  }

  async delete(id: string): Promise<Contact> {
    return this.prismaClient.contact.delete({
      where: { id }
    });
  }

  async count(where?: Prisma.ContactWhereInput): Promise<number> {
    return this.prismaClient.contact.count({ where });
  }
}
