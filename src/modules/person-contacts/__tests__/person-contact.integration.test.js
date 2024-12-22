const request = require('supertest');
const app = require('../../../app');

describe('Person Contacts Integration Tests', () => {
    let authToken;
    let personId;
    let createdContactId;

    beforeAll(async () => {
        // Obtém token de autenticação para testes
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: process.env.TEST_USER_EMAIL,
                password: process.env.TEST_USER_PASSWORD
            });
        
        authToken = loginResponse.body.token;

        // Cria uma pessoa para testes
        const personResponse = await request(app)
            .post('/api/persons')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Pessoa Teste Contatos',
                document: '12345678901',
                birth_date: '1990-01-01'
            });

        personId = personResponse.body.id;
    });

    it('deve criar um contato para uma pessoa', async () => {
        const contactData = {
            person_id: personId,
            type: 'email',
            contact: 'teste@exemplo.com',
            is_main: true
        };

        const response = await request(app)
            .post('/api/person-contacts')
            .set('Authorization', `Bearer ${authToken}`)
            .send(contactData);

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.contact).toBe(contactData.contact);
        
        createdContactId = response.body.id;
    });

    it('deve buscar contatos de uma pessoa', async () => {
        const response = await request(app)
            .get(`/api/person-contacts/person/${personId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve buscar contato principal de uma pessoa', async () => {
        const response = await request(app)
            .get(`/api/person-contacts/person/${personId}/main`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body.is_main).toBe(true);
    });

    it('deve atualizar um contato', async () => {
        const updateData = {
            contact: 'novo_teste@exemplo.com'
        };

        const response = await request(app)
            .put(`/api/person-contacts/${createdContactId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateData);

        expect(response.statusCode).toBe(200);
        expect(response.body.contact).toBe(updateData.contact);
    });

    it('deve remover um contato', async () => {
        const response = await request(app)
            .delete(`/api/person-contacts/${createdContactId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.id).toBe(createdContactId);
    });

    afterAll(async () => {
        // Limpa dados de teste
        await request(app)
            .delete(`/api/persons/${personId}`)
            .set('Authorization', `Bearer ${authToken}`);
    });
});
