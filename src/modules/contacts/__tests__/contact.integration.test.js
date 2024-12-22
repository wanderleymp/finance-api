const request = require('supertest');
const app = require('../../../app');
const { systemDatabase } = require('../../../config/database');

describe('Contatos - Testes de Integração', () => {
    let authToken;
    let createdContactId;
    let personId;

    beforeAll(async () => {
        // Configuração de autenticação e dados de teste
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: process.env.TEST_USER_EMAIL,
                password: process.env.TEST_USER_PASSWORD
            });

        authToken = loginResponse.body.token;

        // Busca um ID de pessoa existente para testes
        const personResult = await systemDatabase.pool.query(
            'SELECT id FROM persons LIMIT 1'
        );
        personId = personResult.rows[0].id;
    });

    describe('Criação de Contato', () => {
        it('deve criar um novo contato', async () => {
            const contactData = {
                person_id: personId,
                type: 'phone',
                contact: '11999999999'
            };

            const response = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(contactData);

            expect(response.statusCode).toBe(201);
            expect(response.body.contact).toBe('11999999999');
            
            createdContactId = response.body.id;
        });

        it('deve rejeitar criação com dados inválidos', async () => {
            const invalidContactData = {
                person_id: personId,
                type: 'invalid', // Tipo inválido
                contact: '' 
            };

            const response = await request(app)
                .post('/api/contacts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidContactData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Busca de Contatos', () => {
        it('deve buscar contatos por pessoa', async () => {
            const response = await request(app)
                .get(`/api/contacts/person/${personId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('deve buscar contato por ID', async () => {
            const response = await request(app)
                .get(`/api/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(createdContactId);
        });
    });

    describe('Atualização de Contato', () => {
        it('deve atualizar um contato existente', async () => {
            const updateData = {
                contact: '11988888888'
            };

            const response = await request(app)
                .put(`/api/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.statusCode).toBe(200);
            expect(response.body.contact).toBe('11988888888');
        });
    });

    describe('Deleção de Contato', () => {
        it('deve deletar um contato que não seja principal', async () => {
            const response = await request(app)
                .delete(`/api/contacts/${createdContactId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
        });
    });

    afterAll(async () => {
        // Limpeza de recursos após os testes
        await systemDatabase.pool.end();
    });
});
