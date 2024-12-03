const accountsReceivableRepository = require('../repositories/accountsReceivableRepository');
const logger = require('../../config/logger');

exports.getAccountsReceivable = async (req, res) => {
    try {
        const {
            movement_status_id = 23,
            person_id,
            due_date_start,
            due_date_end,
            expected_date_start,
            expected_date_end,
            days_overdue,
            movement_type_id,
            order_by = 'due_date',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const filters = {
            movement_status_id,
            person_id,
            due_date_start,
            due_date_end,
            expected_date_start,
            expected_date_end,
            days_overdue,
            movement_type_id
        };

        const options = {
            order_by,
            order,
            page: parseInt(page),
            limit: parseInt(limit)
        };

        const result = await accountsReceivableRepository.getAccountsReceivable(filters, options);
        res.json(result);
    } catch (error) {
        logger.error('Error fetching accounts receivable:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
