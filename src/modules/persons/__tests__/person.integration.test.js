const request = require('supertest');
const app = require('../../../app');
const { systemDatabase } = require('../../../config/database');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env.test') });

describe('Pessoas - Testes de Integração', () => {
    let authToken;
    let createdPersonId;

    beforeAll(async () => {
        // Gera um token JWT diretamente para testes
        authToken = jwt.sign(
            { 
                user_id: 1,
                username: 'Test User',
                profile_id: null
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION }
        );
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
                .post('/persons')
                .set('Authorization', `Bearer ${authToken}`)
                .send(personData);

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe('Pessoa Teste');
            
            createdPersonId = response.body.id;
        });
    });
});
