const request = require('supertest');
const app = require('../../../app');
const UserService = require('../user.service');
const { generateTestToken } = require('../../../utils/test-helpers');

describe('User Routes', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        // Criar um token de teste
        authToken = generateTestToken({ userId: 1 });

        // Criar um usuário de teste
        testUser = {
            username: 'testuser',
            password: 'Test@123',
            person_id: 1,
            profile_id: 1,
            active: true
        };
    });

    describe('POST /', () => {
        it('should create a new user when valid data is provided', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user_id');
            expect(response.body.username).toBe(testUser.username);
        });

        it('should return 400 when invalid data is provided', async () => {
            const invalidUser = { ...testUser, username: '' };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidUser);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /', () => {
        it('should list users with pagination', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('rows');
            expect(response.body).toHaveProperty('count');
            expect(Array.isArray(response.body.rows)).toBe(true);
        });

        it('should filter users by username', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ username: 'test' });

            expect(response.status).toBe(200);
            expect(response.body.rows.every(user => 
                user.username.toLowerCase().includes('test')
            )).toBe(true);
        });
    });

    describe('GET /:id', () => {
        it('should return a user when valid ID is provided', async () => {
            // Primeiro criar um usuário para ter um ID válido
            const createResponse = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testUser,
                    username: 'getbyidtest'
                });

            const userId = createResponse.body.user_id;

            const response = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user_id', userId);
        });

        it('should return 404 when user is not found', async () => {
            const response = await request(app)
                .get('/api/users/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /:id', () => {
        it('should update a user when valid data is provided', async () => {
            // Primeiro criar um usuário para ter um ID válido
            const createResponse = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testUser,
                    username: 'updatetest'
                });

            const userId = createResponse.body.user_id;
            const updateData = {
                active: false
            };

            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('active', false);
        });

        it('should return 404 when user is not found', async () => {
            const response = await request(app)
                .put('/api/users/99999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ active: false });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /:id', () => {
        it('should delete a user when valid ID is provided', async () => {
            // Primeiro criar um usuário para ter um ID válido
            const createResponse = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ...testUser,
                    username: 'deletetest'
                });

            const userId = createResponse.body.user_id;

            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(204);

            // Verificar se o usuário foi realmente deletado
            const getResponse = await request(app)
                .get(`/api/users/${userId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(getResponse.status).toBe(404);
        });

        it('should return 404 when user is not found', async () => {
            const response = await request(app)
                .delete('/api/users/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /refresh', () => {
        it('should refresh access token when valid refresh token is provided', async () => {
            // Primeiro fazer login para obter um refresh token válido
            const user = await UserService.create({
                ...testUser,
                username: 'refreshtest'
            });

            const refreshToken = user.refresh_token;

            const response = await request(app)
                .post('/api/users/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('expiresIn');
        });

        it('should return 401 when invalid refresh token is provided', async () => {
            const response = await request(app)
                .post('/api/users/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(response.status).toBe(401);
        });
    });
});
