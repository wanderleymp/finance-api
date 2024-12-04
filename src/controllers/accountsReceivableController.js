const accountsReceivableRepository = require('../repositories/accountsReceivableRepository');
const logger = require('../../config/logger');

exports.getAccountsReceivable = async (req, res) => {
    try {
        const {
            movement_status_id = 23,
            person_id = null,
            startDate = null,
            endDate = null,
            dueStartDate = null,
            dueEndDate = null,
            expectedStartDate = null,
            expectedEndDate = null,
            days_overdue = null,
            movement_type_id = null,
            order_by = 'due_date',
            order = 'desc',
            page = 1,
            limit = 10,
            search = null,
            status = null
        } = req.query;

        const filters = {
            movement_status_id: movement_status_id ? parseInt(movement_status_id) : 23,
            person_id: person_id ? parseInt(person_id) : null,
            due_date_start: dueStartDate || startDate,
            due_date_end: dueEndDate || endDate,
            expectedDateStart: expectedStartDate,
            expectedDateEnd: expectedEndDate,
            days_overdue: days_overdue ? parseInt(days_overdue) : null,
            movement_type_id: movement_type_id ? parseInt(movement_type_id) : null,
            search,
            status
        };

        const options = {
            order_by,
            order,
            page: parseInt(page),
            limit: parseInt(limit)
        };

        logger.info('Accounts Receivable Filters', { filters });
        logger.info('Accounts Receivable Options', { options });

        const result = await accountsReceivableRepository.getAccountsReceivable(filters, options);
        res.json(result);
    } catch (error) {
        logger.error('Error fetching accounts receivable:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
};
