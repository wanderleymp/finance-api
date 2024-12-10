import { PrismaClient, PersonLicense, Prisma } from '@prisma/client';

export class PersonLicenseRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: Prisma.PersonLicenseCreateInput): Promise<PersonLicense> {
    return this.prisma.personLicense.create({ data });
  }

  async findById(id: string): Promise<PersonLicense | null> {
    return this.prisma.personLicense.findUnique({ 
      where: { id },
      include: {
        person: true,
        license: true
      }
    });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PersonLicenseWhereUniqueInput;
    where?: Prisma.PersonLicenseWhereInput;
    orderBy?: Prisma.PersonLicenseOrderByWithRelationInput;
  }): Promise<PersonLicense[]> {
    const { skip, take, cursor, where, orderBy } = params || {};
    return this.prisma.personLicense.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        person: true,
        license: true
      }
    });
  }

  async update(id: string, data: Prisma.PersonLicenseUpdateInput): Promise<PersonLicense> {
    return this.prisma.personLicense.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<PersonLicense> {
    return this.prisma.personLicense.delete({
      where: { id }
    });
  }

  async findByPersonAndLicense(person: string, license: string): Promise<PersonLicense | null> {
    return this.prisma.personLicense.findUnique({
      where: {
        person_license: {
          person,
          license
        }
      }
    });
  }
}
