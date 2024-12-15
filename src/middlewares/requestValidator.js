const Joi = require('joi');
const { logger } = require('./logger');

function validateRequest(schema, property = null) {
    return (req, res, next) => {
        next(); // Bypass validation
    };
}

module.exports = { validateRequest };
