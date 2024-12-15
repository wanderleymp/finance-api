const express = require('express');
const UserController = require('../controllers/userController');
const PasswordController = require('../controllers/passwordController');
const { authMiddleware } = require('../middlewares/auth');
const { httpLogger } = require('../middlewares/logger');
const { validateRequest } = require('../middlewares/requestValidator');
const userSchema = require('../schemas/userSchema');
const passwordSchema = require('../schemas/passwordSchema');
const JwtMiddleware = require('../middlewares/jwtMiddleware');
const { loginLimiter } = require('../middlewares/security/rateLimiter');
const { passwordResetLimiter } = require('../middlewares/security/passwordResetLimiter');

const router = express.Router();

// Middleware de log para todas as rotas
router.use(httpLogger);

// Rotas públicas de autenticação
router.post('/register', 
    validateRequest(userSchema.create), 
    UserController.register
);
router.post('/login', 
    loginLimiter,
    validateRequest(userSchema.login), 
    UserController.login
);

router.post('/refresh', 
    validateRequest(userSchema.refreshToken), 
    UserController.refreshToken
);

// Rotas públicas de recuperação de senha
router.post('/forgot-password',
    passwordResetLimiter,
    validateRequest(passwordSchema.requestReset),
    PasswordController.requestReset
);

router.post('/reset-password',
    passwordResetLimiter,
    validateRequest(passwordSchema.resetPassword),
    PasswordController.resetPassword
);

// Rotas protegidas de usuário
router.use(authMiddleware);

// Rotas de 2FA
router.post('/2fa/enable', UserController.enable2FA);
router.post('/2fa/verify', 
    validateRequest(userSchema.verify2FA), 
    UserController.verify2FA
);
router.post('/2fa/disable', UserController.disable2FA);

// Rotas de usuário
router.get('/', 
    validateRequest(userSchema.list, 'query'), 
    UserController.listUsers
);

router.get('/:id', 
    validateRequest(userSchema.getById, 'params'), 
    UserController.getUser
);

router.get('/person/:personId', 
    validateRequest(userSchema.getByPerson, 'params'), 
    UserController.getUsersByPerson
);

router.put('/:id', 
    validateRequest(userSchema.update), 
    UserController.updateUser
);

router.put('/:userId/password', 
    validateRequest(userSchema.updatePassword),
    UserController.updatePassword
);

router.delete('/:id', 
    validateRequest(userSchema.delete, 'params'), 
    UserController.deleteUser
);

// Rotas de senha
router.post('/change-password',
    validateRequest(userSchema.updatePassword),
    PasswordController.changePassword
);

module.exports = router;
