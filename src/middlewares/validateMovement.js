const { MovementValidationError } = require('../utils/errors/MovementError');
const logger = require('../../config/logger');

const validateMovementSchema = {
    movement_date: {
        type: 'date',
        required: true
    },
    person_id: {
        type: 'number',
        required: true
    },
    total_amount: {
        type: 'number',
        required: true,
        min: 0
    },
    license_id: {
        type: 'number',
        required: true
    },
    description: {
        type: 'string',
        required: false,
        maxLength: 500
    },
    items: {
        type: 'array',
        required: true,
        minItems: 1,
        items: {
            type: 'object',
            properties: {
                product_id: { type: 'number', required: true },
                quantity: { type: 'number', required: true, min: 0 },
                unit_value: { type: 'number', required: true, min: 0 }
            }
        }
    }
};

function validateField(value, schema, path = '') {
    if (schema.required && (value === undefined || value === null)) {
        throw new MovementValidationError(`Field ${path} is required`);
    }

    if (value !== undefined && value !== null) {
        if (schema.type === 'number' && typeof value !== 'number' && isNaN(Number(value))) {
            throw new MovementValidationError(`Field ${path} must be a valid number`);
        }

        if (schema.type === 'string' && typeof value !== 'string') {
            throw new MovementValidationError(`Field ${path} must be a string`);
        }

        if (schema.type === 'date' && !(value instanceof Date) && isNaN(Date.parse(value))) {
            throw new MovementValidationError(`Field ${path} must be a valid date`);
        }

        if (schema.type === 'array' && !Array.isArray(value)) {
            throw new MovementValidationError(`Field ${path} must be an array`);
        }

        if (schema.min !== undefined && value < schema.min) {
            throw new MovementValidationError(`Field ${path} must be greater than or equal to ${schema.min}`);
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            throw new MovementValidationError(`Field ${path} must not exceed ${schema.maxLength} characters`);
        }

        if (schema.minItems !== undefined && value.length < schema.minItems) {
            throw new MovementValidationError(`Field ${path} must have at least ${schema.minItems} items`);
        }

        if (schema.items && Array.isArray(value)) {
            value.forEach((item, index) => {
                Object.entries(schema.items.properties).forEach(([key, propSchema]) => {
                    validateField(item[key], propSchema, `${path}[${index}].${key}`);
                });
            });
        }
    }
}

function validateMovement(req, res, next) {
    try {
        const movement = req.body;
        
        // Convert string numbers to actual numbers
        if (movement.person_id) movement.person_id = Number(movement.person_id);
        if (movement.license_id) movement.license_id = Number(movement.license_id);
        if (movement.total_amount) movement.total_amount = Number(movement.total_amount);
        
        if (movement.items) {
            movement.items = movement.items.map(item => ({
                ...item,
                product_id: Number(item.product_id),
                quantity: Number(item.quantity),
                unit_value: Number(item.unit_value)
            }));
        }
        
        Object.entries(validateMovementSchema).forEach(([key, schema]) => {
            validateField(movement[key], schema, key);
        });

        // Validate total amount matches sum of items
        const calculatedTotal = movement.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_value);
        }, 0);

        if (Math.abs(calculatedTotal - movement.total_amount) > 0.01) {
            throw new MovementValidationError('Total amount does not match sum of items', {
                calculated: calculatedTotal,
                provided: movement.total_amount
            });
        }

        next();
    } catch (error) {
        logger.error('Movement validation error:', { 
            error: error.message, 
            details: error.details,
            body: req.body
        });
        res.status(error.statusCode || 400).json({ 
            error: error.message,
            details: error.details
        });
    }
}

module.exports = validateMovement;
