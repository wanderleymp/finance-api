import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserStatus } from '../entities/User';
import { Role } from '../entities/Role';
import { AppDataSource } from '../config/typeorm';
import { ApiError } from '../utils/apiErrors';

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  name?: string;
  roleIds?: number[];
  person_id?: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  roleIds?: number[];
  person_id?: number;
}

export class UserService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  async createUser(userData: CreateUserDto): Promise<Partial<User>> {
    // Verificar se usuário já existe
    const existingUser = await this.userRepository.findOne({ 
      where: [
        { email: userData.email },
        { username: userData.username }
      ] 
    });

    if (existingUser) {
      throw new ApiError('Usuário já cadastrado', 409);
    }

    // Criptografar senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Buscar roles
    const roles = userData.roleIds 
      ? await this.roleRepository.find({ 
          where: { id: In(userData.roleIds) } 
        }) 
      : [];

    // Criar usuário
    const user = this.userRepository.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      person_id: userData.person_id,
      status: UserStatus.ACTIVE,
      roles: roles
    });

    const savedUser = await this.userRepository.save(user);

    // Remover campos sensíveis
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async findUsers(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{
    users: Partial<User>[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page, pageSize, search } = options;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .select([
        'user.id', 
        'user.username', 
        'user.email', 
        'user.name', 
        'user.status', 
        'user.lastLogin'
      ])
      .where('user.status != :status', { status: UserStatus.INACTIVE });

    if (search) {
      queryBuilder.andWhere('(user.username LIKE :search OR user.email LIKE :search OR user.name LIKE :search)', { 
        search: `%${search}%` 
      });
    }

    const [users, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      users,
      total,
      page,
      pageSize
    };
  }

  async updateUser(
    userId: string, 
    userData: UpdateUserDto
  ): Promise<Partial<User>> {
    // Buscar usuário existente
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['roles']
    });

    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Verificar se email já existe
    if (userData.email && userData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ 
        where: { email: userData.email } 
      });

      if (existingUser) {
        throw new ApiError('Email já cadastrado', 409);
      }
    }

    // Atualizar roles se fornecidas
    if (userData.roleIds) {
      const roles = await this.roleRepository.find({ 
        where: { id: In(userData.roleIds) } 
      });
      user.roles = roles;
    }

    // Atualizar campos
    user.name = userData.name || user.name;
    user.email = userData.email || user.email;
    user.person_id = userData.person_id || user.person_id;

    const updatedUser = await this.userRepository.save(user);

    // Remover campos sensíveis
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }

  async findUserById(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ 
      where: { id: id },
      relations: ['roles']
    });

    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Remover campos sensíveis
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { id },
      relations: ['roles'] // Optional: include related roles if needed
    });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'email', 'status'] 
    });
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    const user = await this.findUserById(id);
    
    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Update basic user information
    if (userData.name) user.name = userData.name;
    if (userData.email) user.email = userData.email;

    // Handle role updates if roleIds are provided
    if (userData.roleIds && userData.roleIds.length > 0) {
      const roles = await this.roleRepository.find({
        where: { id: In(userData.roleIds) }
      });
      
      if (roles.length !== userData.roleIds.length) {
        throw new ApiError('Uma ou mais funções não encontradas', 400);
      }
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    
    if (!user) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    // Set user status to INACTIVE instead of hard delete
    user.status = UserStatus.INACTIVE;
    await this.userRepository.save(user);
  }
}
