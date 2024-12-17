const request = require('supertest');
const { systemDatabase } = require('../../src/config/database');
const app = require('../../src/server'); // Assumindo que este é o arquivo que exporta o app Express

describe('Items Integration Tests', () => {
    let authToken;
    let createdItemId;

    // Configuração antes de todos os testes
    beforeAll(async () => {
        // Configurar conexão com banco de dados
        await systemDatabase.connect();

        // Limpar tabela de items antes dos testes
        await systemDatabase.pool.query('DELETE FROM items');

        // Autenticação (assumindo que você tem uma rota de login)
        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: 'admin@teste.com', // Substitua com um usuário de teste
                password: 'senha123'
            });
        
        authToken = loginResponse.body.token;
    });

    // Limpeza após todos os testes
    afterAll(async () => {
        await systemDatabase.pool.query('DELETE FROM items');
        await systemDatabase.disconnect();
    });

    describe('POST /items', () => {
        it('deve criar um novo item', async () => {
            const itemData = {
                name: 'Produto de Teste',
                description: 'Descrição do produto de teste',
                category: 'Eletrônicos',
                price: 199.99,
                stock_quantity: 10,
                unit: 'UN',
                is_active: true
            };

            const response = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send(itemData);

            expect(response.statusCode).toBe(201);
            expect(response.body.name).toBe(itemData.name);
            expect(response.body.price).toBe(itemData.price);
            
            // Guardar ID para testes subsequentes
            createdItemId = response.body.item_id;
        });

        it('deve rejeitar item sem nome', async () => {
            const invalidItemData = {
                price: 199.99
            };

            const response = await request(app)
                .post('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidItemData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /items', () => {
        beforeEach(async () => {
            // Popular alguns items para teste de listagem
            const items = [
                {
                    name: 'Item 1',
                    category: 'Eletrônicos',
                    price: 100.00,
                    stock_quantity: 5
                },
                {
                    name: 'Item 2',
                    category: 'Informática',
                    price: 200.00,
                    stock_quantity: 10
                }
            ];

            for (const item of items) {
                await request(app)
                    .post('/items')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(item);
            }
        });

        it('deve listar items com paginação', async () => {
            const response = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ page: 1, limit: 10 });

            expect(response.statusCode).toBe(200);
            expect(response.body.data).toBeTruthy();
            expect(response.body.meta.total).toBeGreaterThan(0);
        });

        it('deve filtrar items por categoria', async () => {
            const response = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ category: 'Eletrônicos' });

            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.every(item => item.category === 'Eletrônicos')).toBe(true);
        });

        it('deve filtrar items por faixa de preço', async () => {
            const response = await request(app)
                .get('/items')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ 
                    min_price: 50, 
                    max_price: 150 
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data.every(item => 
                item.price >= 50 && item.price <= 150
            )).toBe(true);
        });
    });

    describe('GET /items/:id', () => {
        it('deve buscar item por ID', async () => {
            const response = await request(app)
                .get(`/items/${createdItemId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.item_id).toBe(createdItemId);
        });

        it('deve retornar 404 para item não existente', async () => {
            const response = await request(app)
                .get('/items/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(404);
        });
    });

    describe('PUT /items/:id', () => {
        it('deve atualizar um item existente', async () => {
            const updateData = {
                name: 'Produto Atualizado',
                price: 299.99
            };

            const response = await request(app)
                .put(`/items/${createdItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.statusCode).toBe(200);
            expect(response.body.name).toBe(updateData.name);
            expect(response.body.price).toBe(updateData.price);
        });

        it('deve rejeitar atualização com preço negativo', async () => {
            const invalidUpdateData = {
                price: -10
            };

            const response = await request(app)
                .put(`/items/${createdItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidUpdateData);

            expect(response.statusCode).toBe(400);
        });
    });

    describe('DELETE /items/:id', () => {
        it('deve excluir um item existente', async () => {
            const response = await request(app)
                .delete(`/items/${createdItemId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(204);
        });

        it('deve retornar 404 ao tentar excluir item inexistente', async () => {
            const response = await request(app)
                .delete('/items/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.statusCode).toBe(404);
        });
    });
});
