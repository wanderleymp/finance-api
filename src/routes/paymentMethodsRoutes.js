const express = require('express');
const router = express.Router();
const paymentMethodsController = require('../controllers/paymentMethodsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, paymentMethodsController.create);
router.get('/', authMiddleware, paymentMethodsController.list);
router.get('/:id', authMiddleware, paymentMethodsController.getById);
router.put('/:id', authMiddleware, paymentMethodsController.update);
router.delete('/:id', authMiddleware, paymentMethodsController.delete);

module.exports = router;
