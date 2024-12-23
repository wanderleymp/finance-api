const express = require('express');
const AuthController = require('./auth.controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const authSchema = require('./schemas/auth.schema');
const rateLimiter = require('../../middlewares/security/rateLimiter');

const router = express.Router();

// Rotas públicas (não requerem autenticação)
router.post('/login',
    rateLimiter.loginLimiter,
    validateRequest(authSchema.login),
    AuthController.login
);

router.post('/refresh',
    validateRequest(authSchema.refresh),
    AuthController.refreshToken
);

// Rotas que requerem autenticação
router.post('/logout',
    authMiddleware,
    validateRequest(authSchema.logout),
    AuthController.logout
);

module.exports = router;
