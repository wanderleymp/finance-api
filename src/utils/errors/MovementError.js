class MovementError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.name = 'MovementError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

class MovementNotFoundError extends MovementError {
    constructor(movementId) {
        super(`Movement with ID ${movementId} not found`, 404, { movementId });
        this.name = 'MovementNotFoundError';
    }
}

class MovementValidationError extends MovementError {
    constructor(message, details) {
        super(message, 400, details);
        this.name = 'MovementValidationError';
    }
}

module.exports = {
    MovementError,
    MovementNotFoundError,
    MovementValidationError
};
