const express = require('express');
const router = express.Router();
const accountsReceivableController = require('../controllers/accountsReceivableController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rota para obter contas a receber
router.get('/', authenticateToken, accountsReceivableController.getAccountsReceivable);

module.exports = router;
