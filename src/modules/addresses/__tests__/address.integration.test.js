const request = require('supertest');
const app = require('../../../app');
const { systemDatabase } = require('../../../config/database');

describe.skip('Endereços - Testes de Integração', () => {
    let authToken;
    let createdAddressId;
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

    describe('Criação de Endereço', () => {
        it('deve criar um novo endereço', async () => {
            const addressData = {
                person_id: personId,
                street: 'Rua de Teste',
                number: '123',
                neighborhood: 'Bairro Teste',
                city: 'Cidade Teste',
                state: 'SP',
                postal_code: '01000-000'
            };

            const response = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(addressData);

            expect(response.statusCode).toBe(201);
            expect(response.body.street).toBe(addressData.street);
            
            createdAddressId = response.body.id;
        });

        it('deve rejeitar criação com dados inválidos', async () => {
            const invalidAddressData = {
                person_id: personId,
                street: '', // Campo obrigatório vazio
                state: 'XX' // Estado inválido
            };

            const response = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidAddressData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Busca de Endereços', () => {
        it('deve buscar endereços por pessoa', async () => {
            const response = await request(app)
                .get(`/api/addresses/person/${personId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('deve buscar endereço por ID', async () => {
            const response = await request(app)
                .get(`/api/addresses/${createdAddressId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(createdAddressId);
        });
    });

    describe('Atualização de Endereço', () => {
        it('deve atualizar um endereço existente', async () => {
            const updateData = {
                street: 'Rua Atualizada',
                number: '456'
            };

            const response = await request(app)
                .put(`/api/addresses/${createdAddressId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.statusCode).toBe(200);
            expect(response.body.street).toBe(updateData.street);
        });
    });

    describe('Deleção de Endereço', () => {
        it('deve deletar um endereço que não seja principal', async () => {
            const response = await request(app)
                .delete(`/api/addresses/${createdAddressId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
        });
    });

    afterAll(async () => {
        // Limpeza de recursos após os testes
        await systemDatabase.pool.end();
    });
});
