const accountsReceivableRepository = require('../repositories/accountsReceivableRepository');
const logger = require('../../config/logger');

exports.getAccountsReceivable = async (req, res) => {
    try {
        logger.info('Accounts Receivable Request Query', { query: req.query });

        const {
            movement_status_id = 23,
            person_id = null,
            due_date_start = null,
            due_date_end = null,
            expected_date_start = null,
            expected_date_end = null,
            days_overdue = null,
            movement_type_id = null,
            order_by = 'due_date',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const filters = {
            movement_status_id: movement_status_id ? parseInt(movement_status_id) : 23,
            person_id: person_id ? parseInt(person_id) : null,
            due_date_start,
            due_date_end,
            expected_date_start,
            expected_date_end,
            days_overdue: days_overdue ? parseInt(days_overdue) : null,
            movement_type_id: movement_type_id ? parseInt(movement_type_id) : null
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
