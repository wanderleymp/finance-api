const { PrismaClient } = require('@prisma/client');
const logger = require('../../../config/logger');

class PrismaTaskRepository {
    constructor() {
        this.prisma = new PrismaClient({
            log: ['error', 'warn'],
            errorFormat: 'minimal'
        });
    }

    async findAll(where = {}, skip = 0, take = 10) {
        try {
            const [tasks, total] = await Promise.all([
                this.prisma.tasks.findMany({
                    where,
                    include: {
                        tasks_status: true,
                        task_logs: {
                            orderBy: {
                                created_at: 'desc'
                            },
                            take: 1
                        }
                    },
                    skip,
                    take,
                    orderBy: { 
                        created_at: 'desc' 
                    }
                }),
                this.prisma.tasks.count({ where })
            ]);

            return {
                data: tasks,
                pagination: {
                    total,
                    page: Math.floor(skip / take) + 1,
                    limit: take,
                    totalPages: Math.ceil(total / take)
                }
            };
        } catch (error) {
            logger.error('Error finding tasks:', { 
                error: error.message,
                stack: error.stack,
                where,
                skip,
                take
            });
            throw error;
        }
    }

    async findById(id) {
        try {
            const task = await this.prisma.tasks.findUnique({
                where: { task_id: Number(id) },
                include: {
                    tasks_status: true,
                    task_logs: {
                        orderBy: {
                            created_at: 'desc'
                        },
                        include: {
                            tasks_status: true
                        }
                    }
                }
            });

            return task;
        } catch (error) {
            logger.error('Error finding task by id:', { 
                error: error.message,
                stack: error.stack,
                id 
            });
            throw error;
        }
    }

    async create(data) {
        try {
            const task = await this.prisma.tasks.create({
                data: {
                    name: data.name,
                    description: data.description,
                    process_id: data.processId || 1,
                    status_id: data.statusId,
                    execution_mode_id: data.executionModeId,
                    task_logs: {
                        create: {
                            status_id: data.statusId,
                            message: 'Tarefa criada'
                        }
                    }
                },
                include: {
                    tasks_status: true,
                    task_logs: true
                }
            });

            return task;
        } catch (error) {
            logger.error('Error creating task:', { 
                error: error.message,
                stack: error.stack,
                data 
            });
            throw error;
        }
    }

    async updateStatus(id, statusId, message) {
        try {
            const [task] = await this.prisma.$transaction([
                this.prisma.tasks.update({
                    where: { task_id: Number(id) },
                    data: { 
                        status_id: statusId,
                        updated_at: new Date()
                    },
                    include: {
                        tasks_status: true
                    }
                }),
                this.prisma.task_logs.create({
                    data: {
                        task_id: Number(id),
                        status_id: statusId,
                        message: message || 'Status atualizado'
                    }
                })
            ]);

            return task;
        } catch (error) {
            logger.error('Error updating task status:', { 
                error: error.message,
                stack: error.stack,
                id,
                statusId,
                message 
            });
            throw error;
        }
    }

    async findTaskErrors(id) {
        try {
            const errorLogs = await this.prisma.task_logs.findMany({
                where: {
                    task_id: Number(id),
                    OR: [
                        { message: { contains: 'error', mode: 'insensitive' } },
                        { message: { contains: 'fail', mode: 'insensitive' } },
                        { message: { contains: 'exception', mode: 'insensitive' } }
                    ]
                },
                orderBy: {
                    created_at: 'desc'
                },
                include: {
                    tasks_status: true
                }
            });

            return errorLogs;
        } catch (error) {
            logger.error('Error finding task errors:', { 
                error: error.message,
                stack: error.stack,
                id 
            });
            throw error;
        }
    }

    async findTaskStatus(name) {
        try {
            return await this.prisma.tasks_status.findFirst({
                where: { name }
            });
        } catch (error) {
            logger.error('Error finding task status:', { 
                error: error.message,
                stack: error.stack,
                name 
            });
            throw error;
        }
    }
}

module.exports = PrismaTaskRepository;
