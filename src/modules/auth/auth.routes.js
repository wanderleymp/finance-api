const express = require('express');
const authController = require('./auth.controller');
const { validateRequest } = require('../../middlewares/requestValidator');
const { authMiddleware } = require('../../middlewares/auth');
const authSchema = require('./schemas/auth.schema');
const rateLimiter = require('../../middlewares/security/rateLimiter');

const router = express.Router();

// Rotas públicas (não requerem autenticação)
router.post('/login',
    rateLimiter.loginLimiter,
    validateRequest(authSchema.login),
    authController.login
);

router.post('/refresh',
    validateRequest(authSchema.refresh),
    authController.refreshToken
);

// Rotas que requerem autenticação
router.post('/logout',
    authMiddleware,
    validateRequest(authSchema.logout),
    authController.logout
);

module.exports = router;
