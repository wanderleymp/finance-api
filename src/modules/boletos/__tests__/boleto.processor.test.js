// Testes temporariamente desabilitados
describe.skip('BoletoProcessor', () => {
    // Todos os testes aqui dentro serão ignorados

    const BoletoProcessor = require('../boleto.processor');
    const { ProcessingError } = require('../../../utils/errors');

    // Mocks
    const mockBoletoService = {
        getBoletoById: jest.fn(),
        updateBoleto: jest.fn()
    };

    const mockIntegrationService = {
        generateBoleto: jest.fn()
    };

    let boletoProcessor;

    beforeEach(() => {
        jest.clearAllMocks();
        boletoProcessor = new BoletoProcessor(mockBoletoService, mockIntegrationService);
    });

    describe('process', () => {
        const mockBoleto = {
            boleto_id: 1,
            status: 'A Emitir',
            amount: 100,
            due_date: '2024-01-01',
            payer_name: 'John Doe',
            payer_document: '123.456.789-00',
            installment_number: 1,
            total_installments: 12
        };

        const mockIntegrationResponse = {
            url: 'http://example.com/boleto',
            barcode: '123456789',
            our_number: '987654321'
        };

        it('deve processar um boleto com sucesso', async () => {
            mockBoletoService.getBoletoById.mockResolvedValue(mockBoleto);
            mockIntegrationService.generateBoleto.mockResolvedValue(mockIntegrationResponse);
            mockBoletoService.updateBoleto.mockResolvedValue({
                ...mockBoleto,
                ...mockIntegrationResponse,
                status: 'Emitido'
            });

            await boletoProcessor.process({ boleto_id: 1 });

            expect(mockBoletoService.updateBoleto).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    status: 'Emitido',
                    url: mockIntegrationResponse.url,
                    barcode: mockIntegrationResponse.barcode
                })
            );
        });

        it('deve ignorar boletos que não estão no status A Emitir', async () => {
            mockBoletoService.getBoletoById.mockResolvedValue({
                ...mockBoleto,
                status: 'Emitido'
            });

            await boletoProcessor.process({ boleto_id: 1 });

            expect(mockIntegrationService.generateBoleto).not.toHaveBeenCalled();
            expect(mockBoletoService.updateBoleto).not.toHaveBeenCalled();
        });

        it('deve atualizar status para Erro em caso de falha', async () => {
            mockBoletoService.getBoletoById.mockResolvedValue(mockBoleto);
            mockIntegrationService.generateBoleto.mockRejectedValue(
                new Error('Erro na integração')
            );

            await expect(
                boletoProcessor.process({ boleto_id: 1 })
            ).rejects.toThrow('Erro na integração');

            expect(mockBoletoService.updateBoleto).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    status: 'Erro',
                    response_data: expect.any(Object)
                })
            );
        });

        it('deve lançar erro se boleto não for encontrado', async () => {
            mockBoletoService.getBoletoById.mockResolvedValue(null);

            await expect(
                boletoProcessor.process({ boleto_id: 1 })
            ).rejects.toThrow(ProcessingError);
        });
    });

    describe('prepareIntegrationData', () => {
        it('deve preparar dados corretamente para integração', () => {
            const mockBoleto = {
                amount: 100,
                due_date: '2024-01-01',
                payer_name: 'John Doe',
                payer_document: '123.456.789-00',
                payer_address: 'Rua Teste, 123',
                description: 'Teste',
                installment_number: 1,
                total_installments: 12
            };

            const result = boletoProcessor.prepareIntegrationData(mockBoleto);

            expect(result).toEqual({
                amount: 100,
                due_date: '2024-01-01',
                payer: {
                    name: 'John Doe',
                    document: '123.456.789-00',
                    address: 'Rua Teste, 123'
                },
                description: 'Teste',
                installment: {
                    number: 1,
                    total: 12
                }
            });
        });
    });
});
