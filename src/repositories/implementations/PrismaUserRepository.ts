import { PrismaClient } from '@prisma/client';
import IUserRepository from '../interfaces/IUserRepository';

class PrismaUserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async create(data: CreateUserDTO): Promise<User> {
    return this.prisma.user.create({
      data
    });
  }

  async update(id: number, data: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id }
    });
  }
}

export default PrismaUserRepository;
