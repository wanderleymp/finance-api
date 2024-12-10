import { Request, Response } from 'express';
import { UserService, CreateUserDto, UpdateUserDto } from '../services/userService';
import { ApiError } from '../utils/apiErrors';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';

// DTOs com validações
export class CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export class UpdateUserRequest {
  name?: string;
  email?: string;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createUser(req: Request, res: Response): Promise<Response> {
    try {
      // Validar entrada
      const createUserDto = plainToClass(CreateUserRequest, req.body);
      await validateOrReject(createUserDto);

      const userData: CreateUserDto = {
        ...createUserDto,
        roleIds: req.body.roleIds || []
      };

      const user = await this.userService.createUser(userData);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async listUsers(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);
      const search = req.query.search as string;

      const result = await this.userService.findUsers({ 
        page, 
        pageSize, 
        search 
      });

      return res.json(result);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      const user = await this.userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      return res.json(user);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      
      // Validar entrada
      const updateUserDto = plainToClass(UpdateUserRequest, req.body);
      await validateOrReject(updateUserDto);

      const userData: UpdateUserDto = {
        ...updateUserDto,
        roleIds: req.body.roleIds
      };

      const updatedUser = await this.userService.updateUser(userId, userData);
      return res.json(updatedUser);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.params.id;
      await this.userService.deleteUser(userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao desativar usuário:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}
