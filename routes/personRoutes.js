const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rota para obter pessoas vinculadas ao usuário logado
router.get('/', authenticateToken, personController.getPersons);

// Rota para consultar informações de um CNPJ
router.get('/cnpj/:cnpj', authenticateToken, personController.getCNPJ);

router.post('/cnpj/:cnpj', authenticateToken, personController.getCNPJ);

module.exports = router;
