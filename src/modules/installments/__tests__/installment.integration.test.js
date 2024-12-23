const request = require('supertest');
const app = require('../../../app');
const { systemDatabase } = require('../../../config/database');

describe('Installment API', () => {
    let token;

    beforeAll(async () => {
        // Login para obter token
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'admin@email.com',
                password: 'admin'
            });

        token = response.body.token;
    });

    afterAll(async () => {
        await systemDatabase.pool.end();
    });

    describe('GET /installments', () => {
        it('should return list of installments', async () => {
            const response = await request(app)
                .get('/installments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
        });

        it('should filter installments by status', async () => {
            const response = await request(app)
                .get('/installments?status=PENDING')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        status: 'PENDING'
                    })
                ])
            );
        });
    });

    describe('GET /installments/:id', () => {
        it('should return installment by id', async () => {
            const response = await request(app)
                .get('/installments/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('installment_id');
        });

        it('should return 404 for non-existent installment', async () => {
            const response = await request(app)
                .get('/installments/999999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });
});
