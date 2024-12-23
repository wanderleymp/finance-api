const InstallmentService = require('../installment.service');
const InstallmentRepository = require('../installment.repository');
const { ValidationError } = require('../../../utils/errors');

jest.mock('../installment.repository');

describe('InstallmentService', () => {
    let service;
    let mockRepository;

    beforeEach(() => {
        mockRepository = new InstallmentRepository();
        service = new InstallmentService({ installmentRepository: mockRepository });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('listInstallments', () => {
        it('should list installments with filters', async () => {
            const mockData = {
                data: [
                    {
                        installment_id: 1,
                        payment_id: 1,
                        due_date: '2024-12-31',
                        amount: 1000,
                        status: 'PENDING'
                    }
                ],
                pagination: {
                    total: 1,
                    page: 1,
                    limit: 10
                }
            };

            mockRepository.findAll.mockResolvedValue(mockData);

            const result = await service.listInstallments(1, 10, { status: 'PENDING' });

            expect(result).toEqual(mockData);
            expect(mockRepository.findAll).toHaveBeenCalledWith(1, 10, { status: 'PENDING' });
        });
    });

    describe('getInstallmentById', () => {
        it('should get installment by id', async () => {
            const mockData = {
                installment_id: 1,
                payment_id: 1,
                due_date: '2024-12-31',
                amount: 1000,
                status: 'PENDING'
            };

            mockRepository.findById.mockResolvedValue(mockData);

            const result = await service.getInstallmentById(1);

            expect(result).toEqual(mockData);
            expect(mockRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should throw error if installment not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            await expect(service.getInstallmentById(1))
                .rejects
                .toThrow(ValidationError);
        });
    });
});
