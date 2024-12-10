import { PrismaClient, PersonAddress, Prisma } from '@prisma/client';

export class PersonAddressRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: Prisma.PersonAddressCreateInput): Promise<PersonAddress> {
    return this.prisma.personAddress.create({ 
      data,
      include: {
        person: true
      }
    });
  }

  async findById(id: string): Promise<PersonAddress | null> {
    return this.prisma.personAddress.findUnique({ 
      where: { id },
      include: {
        person: true
      }
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersonAddressWhereUniqueInput;
    where?: Prisma.PersonAddressWhereInput;
    orderBy?: Prisma.PersonAddressOrderByWithRelationInput;
  }): Promise<PersonAddress[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.personAddress.findMany({
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

  async update(id: string, data: Prisma.PersonAddressUpdateInput): Promise<PersonAddress> {
    return this.prisma.personAddress.update({
      where: { id },
      data,
      include: {
        person: true
      }
    });
  }

  async delete(id: string): Promise<PersonAddress> {
    return this.prisma.personAddress.delete({
      where: { id }
    });
  }

  async count(where?: Prisma.PersonAddressWhereInput): Promise<number> {
    return this.prisma.personAddress.count({ where });
  }

  async findMainAddressByPersonId(person: string): Promise<PersonAddress | null> {
    return this.prisma.personAddress.findFirst({
      where: { 
        person,
        isMain: true 
      }
    });
  }
}
