const InvoiceRepository = require('../invoice.repository');
const systemDatabase = require('../../../config/database');

describe('InvoiceRepository', () => {
    let invoiceRepository;
    let testInvoiceId;

    beforeAll(async () => {
        invoiceRepository = new InvoiceRepository();
    });

    afterAll(async () => {
        await systemDatabase.pool.end();
    });

    describe('Criação de Fatura', () => {
        it('deve criar uma nova fatura', async () => {
            const invoiceData = {
                reference_id: 'REF_TEST_001',
                status: 'PENDENTE',
                total_value: 1000.50,
                description: 'Fatura de teste'
            };

            const createdInvoice = await invoiceRepository.create(invoiceData);
            
            expect(createdInvoice).toBeDefined();
            expect(createdInvoice.reference_id).toBe(invoiceData.reference_id);
            expect(createdInvoice.status).toBe(invoiceData.status);
            expect(parseFloat(createdInvoice.total_value)).toBe(invoiceData.total_value);
            
            testInvoiceId = createdInvoice.invoice_id;
        });
    });

    describe('Busca de Fatura', () => {
        it('deve buscar fatura por ID', async () => {
            const invoice = await invoiceRepository.findById(testInvoiceId);
            
            expect(invoice).toBeDefined();
            expect(invoice.invoice_id).toBe(testInvoiceId);
        });

        it('deve buscar faturas por referência', async () => {
            const invoices = await invoiceRepository.findByReferenceId('REF_TEST_001');
            
            expect(invoices).toBeDefined();
            expect(invoices.length).toBeGreaterThan(0);
        });
    });

    describe('Atualização de Fatura', () => {
        it('deve atualizar uma fatura', async () => {
            const updateData = {
                status: 'PAGO',
                total_value: 1200.75
            };

            const updatedInvoice = await invoiceRepository.update(testInvoiceId, updateData);
            
            expect(updatedInvoice).toBeDefined();
            expect(updatedInvoice.status).toBe(updateData.status);
            expect(parseFloat(updatedInvoice.total_value)).toBe(updateData.total_value);
        });
    });

    describe('Exclusão de Fatura', () => {
        it('deve excluir uma fatura', async () => {
            const result = await invoiceRepository.delete(testInvoiceId);
            
            expect(result).toBe(true);

            const deletedInvoice = await invoiceRepository.findById(testInvoiceId);
            expect(deletedInvoice).toBeNull();
        });
    });
});
