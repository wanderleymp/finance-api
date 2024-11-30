const { PrismaClient } = require('@prisma/client');
const ILicenseRepository = require('../interfaces/ILicenseRepository');
const logger = require('../../../config/logger');

class PrismaLicenseRepository extends ILicenseRepository {
    constructor() {
        super();
        this.prisma = new PrismaClient();
    }

    async getAllLicenses(filters = {}, skip = 0, take = 10) {
        try {
            const where = { ...filters };
            if (where.active === 'all') {
                delete where.active;
            }

            // Buscar o total de registros
            const total = await this.prisma.licenses.count({ where });

            // Buscar os registros da página atual
            const licenses = await this.prisma.licenses.findMany({
                where,
                skip,
                take,
                orderBy: { license_name: 'asc' },
                include: {
                    persons: {
                        select: {
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
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
                data: licenses,
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
            logger.error('Error fetching licenses:', error);
            throw error;
        }
    }

    async getLicenseById(id) {
        try {
            const license = await this.prisma.licenses.findUnique({
                where: { license_id: parseInt(id) },
                include: {
                    persons: {
                        select: {
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return license;
        } catch (error) {
            logger.error(`Error fetching license ${id}:`, error);
            throw error;
        }
    }

    async createLicense(data) {
        try {
            // Verificar se a pessoa existe
            const person = await this.prisma.persons.findUnique({
                where: { person_id: parseInt(data.person_id) }
            });

            if (!person) {
                throw new Error('Person not found');
            }

            // Verificar se a pessoa já tem uma licença ativa
            const existingLicense = await this.prisma.licenses.findFirst({
                where: {
                    person_id: parseInt(data.person_id),
                    active: true
                }
            });

            if (existingLicense) {
                throw new Error('Person already has a license');
            }

            // Converter a data para o formato correto
            const startDate = new Date(data.start_date);
            startDate.setUTCHours(0, 0, 0, 0);

            // Criar a licença
            const license = await this.prisma.licenses.create({
                data: {
                    ...data,
                    person_id: parseInt(data.person_id),
                    start_date: startDate.toISOString(),
                    active: true
                },
                include: {
                    persons: {
                        select: {
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return license;
        } catch (error) {
            logger.error('Error creating license:', error);
            throw error;
        }
    }

    async updateLicense(id, data) {
        try {
            // Converter a data para o formato correto se presente
            let updateData = { ...data };
            if (updateData.start_date) {
                const startDate = new Date(updateData.start_date);
                startDate.setUTCHours(0, 0, 0, 0);
                updateData.start_date = startDate.toISOString();
            }

            const license = await this.prisma.licenses.update({
                where: { license_id: parseInt(id) },
                data: {
                    ...updateData,
                    active: data.active === true || data.active === 'true'
                },
                include: {
                    persons: {
                        select: {
                            full_name: true,
                            fantasy_name: true,
                            person_documents: {
                                select: {
                                    document_value: true,
                                    document_types: {
                                        select: {
                                            description: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return license;
        } catch (error) {
            logger.error(`Error updating license ${id}:`, error);
            throw error;
        }
    }

    async deleteLicense(id) {
        try {
            await this.prisma.licenses.delete({
                where: { license_id: parseInt(id) }
            });
        } catch (error) {
            logger.error(`Error deleting license ${id}:`, error);
            throw error;
        }
    }

    async getLicenseUsers(licenseId) {
        try {
            const license = await this.prisma.licenses.findUnique({
                where: { license_id: parseInt(licenseId) },
                include: {
                    user_license: {
                        include: {
                            user_accounts: {
                                include: {
                                    persons: {
                                        select: {
                                            person_id: true,
                                            full_name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!license) {
                return null;
            }

            return license.user_license.map(ul => ({
                user_id: ul.user_accounts.user_id,
                name: ul.user_accounts.persons.full_name,
                email: ul.user_accounts.username
            }));
        } catch (error) {
            logger.error('Error in getLicenseUsers:', error);
            throw error;
        }
    }
}

module.exports = PrismaLicenseRepository;
