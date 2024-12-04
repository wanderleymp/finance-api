const { PrismaClient } = require('@prisma/client');
const IBoletoRepository = require('../interfaces/IBoletoRepository');
const logger = require('../../../config/logger');

class PrismaBoletoRepository extends IBoletoRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient({ log: [] });
    }

    async create(data) {
        try {
            logger.info('Creating new boleto', { data });
            const boleto = await this.prisma.boletos.create({ data });
            logger.info('Boleto created successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error creating boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            logger.info('Finding boleto by ID', { id });
            const boleto = await this.prisma.boletos.findUnique({ 
                where: { boleto_id: id },
                include: {
                    installment: true
                }
            });

            if (!boleto) {
                logger.warn('Boleto not found', { id });
                return null;
            }

            return boleto;
        } catch (error) {
            logger.error('Error finding boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async findAll(filters = {}, skip = 0, take = 10) {
        try {
            const where = { ...filters };

            // Buscar o total de registros
            const total = await this.prisma.boletos.count({ where });

            // Buscar os registros da página atual
            const boletos = await this.prisma.boletos.findMany({
                where,
                skip,
                take,
                orderBy: { generated_at: 'desc' },
                include: {
                    installment: {
                        include: {
                            payment: true,
                            movement_payment: {
                                include: {
                                    movement: {
                                        include: {
                                            person: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Calcular metadados da paginação
            const totalPages = Math.ceil(total / take);
            const currentPage = Math.floor(skip / take) + 1;
            const hasNext = currentPage < totalPages;
            const hasPrevious = currentPage > 1;

            return {
                data: boletos,
                pagination: {
                    total,
                    totalPages,
                    currentPage,
                    perPage: take,
                    hasNext,
                    hasPrevious
                }
            };
        } catch (error) {
            logger.error('Error finding boletos', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            logger.info('Updating boleto', { id, data });
            const boleto = await this.prisma.boletos.update({
                where: { boleto_id: id },
                data
            });
            logger.info('Boleto updated successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error updating boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.info('Deleting boleto', { id });
            const boleto = await this.prisma.boletos.delete({
                where: { boleto_id: id }
            });
            logger.info('Boleto deleted successfully', { boleto });
            return boleto;
        } catch (error) {
            logger.error('Error deleting boleto', { 
                error: error.message, 
                stack: error.stack 
            });
            throw error;
        }
    }
}

module.exports = PrismaBoletoRepository;
