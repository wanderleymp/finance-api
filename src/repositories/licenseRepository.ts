import { PrismaClient, License, Prisma } from '@prisma/client';

export class LicenseRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: Prisma.LicenseCreateInput): Promise<License> {
    return this.prisma.license.create({ data });
  }

  async findById(id: string): Promise<License | null> {
    return this.prisma.license.findUnique({ 
      where: { id },
      include: {
        owner: true,
        persons: true,
        users: true
      }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.LicenseWhereUniqueInput;
    where?: Prisma.LicenseWhereInput;
    orderBy?: Prisma.LicenseOrderByWithRelationInput;
  }): Promise<License[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.license.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        owner: true,
        persons: true,
        users: true
      }
    });
  }

  async update(id: string, data: Prisma.LicenseUpdateInput): Promise<License> {
    return this.prisma.license.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<License> {
    return this.prisma.license.delete({
      where: { id }
    });
  }
}
