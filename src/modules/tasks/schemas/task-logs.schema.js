const Joi = require('joi');

const TaskLogsSchema = {
    query: Joi.object({
        task_id: Joi.string().uuid(),
        start_date: Joi.date().iso(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')),
        level: Joi.string().valid('INFO', 'WARNING', 'ERROR'),
        limit: Joi.number().integer().min(1).max(1000),
        offset: Joi.number().integer().min(0)
    })
};

module.exports = TaskLogsSchema;
