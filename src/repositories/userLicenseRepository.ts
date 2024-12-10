import { PrismaClient, UserLicense, Prisma } from '@prisma/client';

export class UserLicenseRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: Prisma.UserLicenseCreateInput): Promise<UserLicense> {
    return this.prisma.userLicense.create({ data });
  }

  async findById(id: string): Promise<UserLicense | null> {
    return this.prisma.userLicense.findUnique({ 
      where: { id },
      include: {
        user: true,
        license: true
      }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserLicenseWhereUniqueInput;
    where?: Prisma.UserLicenseWhereInput;
    orderBy?: Prisma.UserLicenseOrderByWithRelationInput;
  }): Promise<UserLicense[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.userLicense.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        user: true,
        license: true
      }
    });
  }

  async update(id: string, data: Prisma.UserLicenseUpdateInput): Promise<UserLicense> {
    return this.prisma.userLicense.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<UserLicense> {
    return this.prisma.userLicense.delete({
      where: { id }
    });
  }

  async findByUserAndLicense(user: string, license: string): Promise<UserLicense | null> {
    return this.prisma.userLicense.findUnique({
      where: {
        user_license: {
          user,
          license
        }
      }
    });
  }
}
