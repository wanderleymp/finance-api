const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rota para criar um endereço
router.post('/', authenticateToken, addressController.createAddress);

// Rota para obter um endereço pelo ID
router.get('/:id', authenticateToken, addressController.getAddressById);

// Rota para atualizar um endereço pelo ID
router.put('/:id', authenticateToken, addressController.updateAddress);

// Rota para remover um endereço pelo ID
router.delete('/:id', authenticateToken, addressController.deleteAddress);

module.exports = router;
