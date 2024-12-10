declare module '../utils/errorHandler' {
  export class ConflictError extends Error {
    constructor(message: string);
  }
}

declare module '../utils/apiErrors' {
  export class ApiError extends Error {
    errorDetails?: any;
    details?: any;
    constructor(message: string, errorDetails?: any);
  }
}

declare module 'express-validator' {
  export function body(field: string): any;
  export function param(field: string): any;
  export function query(field: string): any;
}
