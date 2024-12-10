import request from 'supertest';
import { PrismaClient, UserRole } from '@prisma/client';
import { app } from '../src/app';
import { generateToken } from '../src/services/authService';
import argon2 from 'argon2';

const prisma = new PrismaClient();

describe('Rotas de Usuário', () => {
  let adminToken: string;
  let regularUserToken: string;
  let adminUser: any;
  let regularUser: any;

  // Configurar dados de teste antes dos testes
  beforeAll(async () => {
    // Criar usuário admin
    const hashedPassword = await argon2.hash('Agile2025');
    adminUser = await prisma.user.create({
      data: {
        user_name: 'admin_test',
        password: hashedPassword,
        role: 'admin'
      }
    });

    // Criar usuário regular
    regularUser = await prisma.user.create({
      data: {
        user_name: 'regular_test',
        password: hashedPassword,
        role: 'user'
      }
    });

    // Gerar tokens
    adminToken = generateToken({
      userId: adminUser.id,
      userName: adminUser.user_name,
      role: adminUser.role
    });

    regularUserToken = generateToken({
      userId: regularUser.id,
      userName: regularUser.user_name,
      role: regularUser.role
    });
  });

  // Limpar banco de dados após os testes
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // Testes para rota GET /users
  describe('GET /users', () => {
    it('Deve retornar lista de usuários para admin', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('Deve retornar 403 para usuário sem permissão', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acesso restrito a administradores');
    });
  });

  // Testes para rota POST /users
  describe('POST /users', () => {
    it('Deve criar usuário com sucesso', async () => {
      const newUser = {
        user_name: 'novo_usuario',
        password: 'Senha123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user.user_name).toBe(newUser.user_name);
      expect(response.body.user.role).toBe(newUser.role);
    });

    it('Deve rejeitar criação sem campos obrigatórios', async () => {
      const invalidUser = {
        user_name: 'usuario_sem_senha'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Nome de usuário e senha são obrigatórios');
    });

    it('Deve rejeitar criação por usuário não admin', async () => {
      const newUser = {
        user_name: 'usuario_nao_autorizado',
        password: 'Senha123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send(newUser);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acesso restrito a administradores');
    });
  });

  // Testes para rota PUT /users
  describe('PUT /users', () => {
    it('Deve atualizar usuário com sucesso', async () => {
      const updateData = {
        user_name: 'usuario_atualizado',
        role: 'admin'
      };

      const response = await request(app)
        .put(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user.user_name).toBe(updateData.user_name);
      expect(response.body.user.role).toBe(updateData.role);
    });

    it('Deve preservar campos não alterados', async () => {
      const partialUpdate = {
        user_name: 'usuario_parcial'
      };

      const response = await request(app)
        .put(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(partialUpdate);

      expect(response.status).toBe(200);
      expect(response.body.user.user_name).toBe(partialUpdate.user_name);
      expect(response.body.user.role).toBe('admin'); // Mantém o role anterior
    });
  });

  // Testes para rota DELETE /users
  describe('DELETE /users', () => {
    it('Deve excluir usuário com sucesso', async () => {
      const userToDelete = await prisma.user.create({
        data: {
          user_name: 'usuario_para_deletar',
          password: await argon2.hash('Senha123!'),
          role: 'user'
        }
      });

      const response = await request(app)
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Usuário removido com sucesso');

      // Verificar se usuário foi realmente removido
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id }
      });
      expect(deletedUser).toBeNull();
    });

    it('Deve rejeitar exclusão por usuário não admin', async () => {
      const response = await request(app)
        .delete(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Acesso restrito a administradores');
    });
  });
});
