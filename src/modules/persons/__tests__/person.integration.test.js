const request = require('supertest');
const app = require('../../../app');
const { systemDatabase } = require('../../../config/database');

describe('Pessoas - Testes de Integração', () => {
    let authToken;
    let createdPersonId;

    beforeAll(async () => {
        // Configuração de autenticação
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: process.env.TEST_USER_EMAIL,
                password: process.env.TEST_USER_PASSWORD
            });

        authToken = loginResponse.body.token;
    });

    describe('Criação de Pessoa', () => {
        it('deve criar uma nova pessoa', async () => {
            const personData = {
                name: 'Pessoa Teste',
                document: '12345678901', // CPF válido
                email: 'pessoa.teste@example.com',
                birth_date: '1990-01-01',
                type: 'individual'
            };

            const response = await request(app)
                .post('/api/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .send(personData);

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe('Pessoa Teste');
            
            createdPersonId = response.body.id;
        });

        it('deve rejeitar criação com documento inválido', async () => {
            const invalidPersonData = {
                name: 'Pessoa Inválida',
                document: '12345', // Documento inválido
                email: 'pessoa.invalida@example.com'
            };

            const response = await request(app)
                .post('/api/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidPersonData);

            expect(response.statusCode).toBe(400);
        });

        it('deve rejeitar criação de pessoa com documento duplicado', async () => {
            const duplicatePersonData = {
                name: 'Pessoa Duplicada',
                document: '12345678901', // Mesmo documento da primeira pessoa criada
                email: 'pessoa.duplicada@example.com'
            };

            const response = await request(app)
                .post('/api/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicatePersonData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Busca de Pessoas', () => {
        it('deve buscar pessoas com paginação', async () => {
            const response = await request(app)
                .get('/api/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.statusCode).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('deve buscar pessoa por ID', async () => {
            const response = await request(app)
                .get(`/api/persons/${createdPersonId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(createdPersonId);
        });

        it('deve buscar detalhes da pessoa', async () => {
            const response = await request(app)
                .get(`/api/persons/${createdPersonId}/details`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.id).toBe(createdPersonId);
        });
    });

    describe('Atualização de Pessoa', () => {
        it('deve atualizar uma pessoa existente', async () => {
            const updateData = {
                name: 'Pessoa Atualizada',
                email: 'pessoa.atualizada@example.com'
            };

            const response = await request(app)
                .put(`/api/persons/${createdPersonId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe('Pessoa Atualizada');
        });

        it('deve rejeitar atualização com documento inválido', async () => {
            const invalidUpdateData = {
                document: '12345' // Documento inválido
            };

            const response = await request(app)
                .put(`/api/persons/${createdPersonId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidUpdateData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('Deleção de Pessoa', () => {
        it('deve deletar uma pessoa sem dependências', async () => {
            const response = await request(app)
                .delete(`/api/persons/${createdPersonId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
        });

        it('deve rejeitar deleção de pessoa com dependências', async () => {
            // Primeiro, criar uma pessoa com endereço e contato
            const personResponse = await request(app)
                .post('/api/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Pessoa com Dependências',
                    document: '98765432109',
                    email: 'pessoa.dependente@example.com'
                });

            const personId = personResponse.body.id;

            // Adicionar um endereço
            await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    person_id: personId,
                    street: 'Rua Teste',
                    number: '123',
                    city: 'Cidade Teste',
                    state: 'SP',
                    zip_code: '12345-678'
                });

            // Tentar deletar pessoa com dependência
            const deleteResponse = await request(app)
                .delete(`/api/persons/${personId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(deleteResponse.statusCode).toBe(400);
        });
    });

    afterAll(async () => {
        // Limpeza de recursos após os testes
        await systemDatabase.pool.end();
    });
});
