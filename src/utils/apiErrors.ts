import { Response } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }

  static sendErrorResponse(res: Response, error: ApiError | Error) {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const errorMessage = error.message || 'Internal Server Error';

    res.status(statusCode).json({
      error: errorMessage,
      status: statusCode
    });
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401);
  }
}
