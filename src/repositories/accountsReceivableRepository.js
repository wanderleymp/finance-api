const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAccountsReceivable = async (filters, options) => {
    const {
        movement_status_id,
        person_id,
        due_date_start,
        due_date_end,
        expected_date_start,
        expected_date_end,
        days_overdue,
        movement_type_id
    } = filters;

    const {
        order_by,
        order,
        page,
        limit
    } = options;

    const skip = (page - 1) * limit;

    const where = {
        movement_status_id: movement_status_id ? parseInt(movement_status_id) : 23,
        person_id: person_id ? parseInt(person_id) : undefined,
        due_date: {
            gte: due_date_start ? new Date(due_date_start) : undefined,
            lte: due_date_end ? new Date(due_date_end) : undefined
        },
        expected_date: {
            gte: expected_date_start ? new Date(expected_date_start) : undefined,
            lte: expected_date_end ? new Date(expected_date_end) : undefined
        },
        days_overdue: days_overdue ? parseInt(days_overdue) : undefined,
        movement_type_id: movement_type_id ? parseInt(movement_type_id) : undefined
    };

    const total = await prisma.accountsReceivable.count({ where });

    const accountsReceivable = await prisma.accountsReceivable.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
            [order_by]: order
        }
    });

    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    return {
        data: accountsReceivable,
        pagination: {
            total,
            totalPages,
            currentPage,
            perPage: limit,
            hasNext,
            hasPrevious
        }
    };
};
