"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.BadRequestError = exports.NotFoundError = exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
    static sendErrorResponse(res, error) {
        const statusCode = error instanceof ApiError ? error.statusCode : 500;
        const errorMessage = error.message || 'Internal Server Error';
        res.status(statusCode).json({
            error: errorMessage,
            status: statusCode
        });
    }
}
exports.ApiError = ApiError;
class NotFoundError extends ApiError {
    constructor(message) {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class BadRequestError extends ApiError {
    constructor(message) {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends ApiError {
    constructor(message) {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=apiErrors.js.map