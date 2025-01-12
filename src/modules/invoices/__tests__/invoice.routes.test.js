const request = require('supertest');
const express = require('express');
const InvoiceRoutes = require('../invoice.routes');
const InvoiceController = require('../invoice.controller');
const { authMiddleware } = require('../../../middlewares/auth');

jest.mock('../invoice.controller');
jest.mock('../../../middlewares/auth');

describe('Invoice Routes', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        // Mock do middleware de autenticação
        authMiddleware.mockImplementation((req, res, next) => next());

        // Registra as rotas
        app.use('/invoices', InvoiceRoutes.getRouter());
    });

    describe('POST /invoices', () => {
        it('deve chamar o método create do controller', async () => {
            const mockInvoice = {
                reference_id: 'REF_TEST_001',
                status: 'PENDENTE',
                total_value: 1000.50
            };

            InvoiceController.prototype.create.mockImplementation((req, res) => {
                res.status(201).json(mockInvoice);
            });

            const response = await request(app)
                .post('/invoices')
                .send(mockInvoice);

            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockInvoice);
            expect(InvoiceController.prototype.create).toHaveBeenCalled();
        });
    });

    describe('GET /invoices', () => {
        it('deve chamar o método findAll do controller', async () => {
            const mockInvoices = [
                { invoice_id: 1, reference_id: 'REF_TEST_001' },
                { invoice_id: 2, reference_id: 'REF_TEST_002' }
            ];

            InvoiceController.prototype.findAll.mockImplementation((req, res) => {
                res.status(200).json(mockInvoices);
            });

            const response = await request(app)
                .get('/invoices')
                .query({ page: 1, limit: 10 });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockInvoices);
            expect(InvoiceController.prototype.findAll).toHaveBeenCalled();
        });
    });

    describe('GET /invoices/:id', () => {
        it('deve chamar o método findById do controller', async () => {
            const mockInvoice = {
                invoice_id: 1,
                reference_id: 'REF_TEST_001'
            };

            InvoiceController.prototype.findById.mockImplementation((req, res) => {
                res.status(200).json(mockInvoice);
            });

            const response = await request(app)
                .get('/invoices/1');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockInvoice);
            expect(InvoiceController.prototype.findById).toHaveBeenCalled();
        });
    });

    describe('PUT /invoices/:id', () => {
        it('deve chamar o método update do controller', async () => {
            const updateData = {
                status: 'PAGO',
                total_value: 1200.75
            };

            const updatedInvoice = {
                invoice_id: 1,
                ...updateData
            };

            InvoiceController.prototype.update.mockImplementation((req, res) => {
                res.status(200).json(updatedInvoice);
            });

            const response = await request(app)
                .put('/invoices/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(updatedInvoice);
            expect(InvoiceController.prototype.update).toHaveBeenCalled();
        });
    });

    describe('DELETE /invoices/:id', () => {
        it('deve chamar o método delete do controller', async () => {
            InvoiceController.prototype.delete.mockImplementation((req, res) => {
                res.status(204).send();
            });

            const response = await request(app)
                .delete('/invoices/1');

            expect(response.status).toBe(204);
            expect(InvoiceController.prototype.delete).toHaveBeenCalled();
        });
    });
});
