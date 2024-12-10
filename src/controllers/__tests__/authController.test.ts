import { register, login } from '../authController';
import prisma from '../../config/prisma';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';

// Mock das dependências
jest.mock('../../config/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn()
}));

describe('Autenticação', () => {
  const mockReq = {
    body: {
      user_name: 'testuser',
      password: 'testpassword'
    }
  } as any;

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Registro', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (prisma.user.create as jest.Mock).mockResolvedValue({ 
        id: 'user-id', 
        user_name: 'testuser' 
      });
      (jwt.sign as jest.Mock).mockReturnValue('mocked-token');

      await register(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { user_name: 'testuser' } 
      });
      expect(argon2.hash).toHaveBeenCalledWith('testpassword');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          user_name: 'testuser',
          password: 'hashedpassword'
        }
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'mocked-token' });
    });

    it('deve retornar erro se usuário já existe', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ 
        id: 'existing-user-id' 
      });

      await register(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Usuário já existe' 
      });
    });
  });

  describe('Login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = { 
        id: 'user-id', 
        user_name: 'testuser', 
        password: 'hashedpassword' 
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mocked-token');

      await login(mockReq, mockRes);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ 
        where: { user_name: 'testuser' } 
      });
      expect(argon2.verify).toHaveBeenCalledWith('hashedpassword', 'testpassword');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'mocked-token' });
    });

    it('deve retornar erro se usuário não existe', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Credenciais inválidas' 
      });
    });

    it('deve retornar erro se senha for inválida', async () => {
      const mockUser = { 
        id: 'user-id', 
        user_name: 'testuser', 
        password: 'hashedpassword' 
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Credenciais inválidas' 
      });
    });
  });
});
