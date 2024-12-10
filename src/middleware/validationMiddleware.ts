import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/apiErrors';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        throw new ApiError('Erro de validação', 400, errorMessages);
      }
      next(error);
    }
  };
};

// Esquemas de validação comuns
export const schemas = {
  login: z.object({
    body: z.object({
      user_name: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(50, 'Nome de usuário deve ter no máximo 50 caracteres'),
      password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
    })
  }),

  registration: z.object({
    body: z.object({
      user_name: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres').max(50, 'Nome de usuário deve ter no máximo 50 caracteres'),
      password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres').max(100, 'Senha deve ter no máximo 100 caracteres')
        .refine((password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password), 'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e 1 número')
    })
  }),

  person: z.object({
    body: z.object({
      full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      fantasy_name: z.string().optional(),
      isCompany: z.boolean().optional()
    })
  }),

  contact: z.object({
    body: z.object({
      type: z.enum(['PHONE', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'OTHER']),
      value: z.string().min(3, 'Valor do contato inválido')
    })
  }),

  personContact: z.object({
    body: z.object({
      person: z.string().uuid('ID da pessoa inválido'),
      contactId: z.string().uuid('ID do contato inválido'),
      description: z.string().optional()
    })
  })
};

// Funções de validação específicas
export function validateLogin(req: Request, res: Response, next: NextFunction) {
  return validateRequest(schemas.login)(req, res, next);
}

export function validateRegistration(req: Request, res: Response, next: NextFunction) {
  return validateRequest(schemas.registration)(req, res, next);
}

export function validatePerson(req: Request, res: Response, next: NextFunction) {
  return validateRequest(schemas.person)(req, res, next);
}

export function validateContact(req: Request, res: Response, next: NextFunction) {
  return validateRequest(schemas.contact)(req, res, next);
}

export function validatePersonContact(req: Request, res: Response, next: NextFunction) {
  return validateRequest(schemas.personContact)(req, res, next);
}

export function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      errors: err.details
    });
  }

  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro inesperado'
  });
}
