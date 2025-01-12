const InvoiceService = require('../invoice.service');
const InvoiceRepository = require('../invoice.repository');
const { DatabaseError } = require('../../../utils/errors');

jest.mock('../invoice.repository');

describe('InvoiceService', () => {
    let invoiceService;
    let mockRepository;

    beforeEach(() => {
        mockRepository = new InvoiceRepository();
        invoiceService = new InvoiceService(mockRepository);
    });

    describe('Criação de Fatura', () => {
        it('deve criar uma nova fatura com sucesso', async () => {
            const invoiceData = {
                reference_id: 'REF_TEST_001',
                status: 'PENDENTE',
                total_value: 1000.50
            };

            const expectedInvoice = {
                ...invoiceData,
                invoice_id: 1
            };

            mockRepository.create.mockResolvedValue(expectedInvoice);

            const result = await invoiceService.create(invoiceData);

            expect(result).toEqual(expectedInvoice);
            expect(mockRepository.create).toHaveBeenCalledWith(invoiceData);
        });

        it('deve lançar erro ao criar fatura inválida', async () => {
            const invalidInvoiceData = {
                reference_id: '',
                status: null,
                total_value: -100
            };

            await expect(invoiceService.create(invalidInvoiceData)).rejects.toThrow();
        });
    });

    describe('Busca de Faturas', () => {
        it('deve buscar faturas por referência', async () => {
            const referenceId = 'REF_TEST_001';
            const expectedInvoices = [
                { invoice_id: 1, reference_id: referenceId },
                { invoice_id: 2, reference_id: referenceId }
            ];

            mockRepository.findByReferenceId.mockResolvedValue(expectedInvoices);

            const result = await invoiceService.findByReferenceId(referenceId);

            expect(result).toEqual(expectedInvoices);
            expect(mockRepository.findByReferenceId).toHaveBeenCalledWith(referenceId);
        });

        it('deve buscar faturas por status', async () => {
            const status = 'PENDENTE';
            const expectedInvoices = [
                { invoice_id: 1, status },
                { invoice_id: 2, status }
            ];

            mockRepository.findByStatus.mockResolvedValue(expectedInvoices);

            const result = await invoiceService.findByStatus(status);

            expect(result).toEqual(expectedInvoices);
            expect(mockRepository.findByStatus).toHaveBeenCalledWith(status, {});
        });
    });

    describe('Atualização de Fatura', () => {
        it('deve atualizar fatura com sucesso', async () => {
            const invoiceId = 1;
            const updateData = {
                status: 'PAGO',
                total_value: 1200.75
            };

            const expectedUpdatedInvoice = {
                invoice_id: invoiceId,
                ...updateData
            };

            mockRepository.update.mockResolvedValue(expectedUpdatedInvoice);

            const result = await invoiceService.update(invoiceId, updateData);

            expect(result).toEqual(expectedUpdatedInvoice);
            expect(mockRepository.update).toHaveBeenCalledWith(invoiceId, updateData);
        });

        it('deve lançar erro ao atualizar fatura inexistente', async () => {
            const invoiceId = 999;
            const updateData = { status: 'PAGO' };

            mockRepository.update.mockRejectedValue(new DatabaseError('Fatura não encontrada'));

            await expect(invoiceService.update(invoiceId, updateData)).rejects.toThrow(DatabaseError);
        });
    });

    describe('Exclusão de Fatura', () => {
        it('deve excluir fatura com sucesso', async () => {
            const invoiceId = 1;

            mockRepository.delete.mockResolvedValue(true);

            const result = await invoiceService.delete(invoiceId);

            expect(result).toBe(true);
            expect(mockRepository.delete).toHaveBeenCalledWith(invoiceId);
        });
    });
});
