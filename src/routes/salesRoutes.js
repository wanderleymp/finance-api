const express = require('express');
const SalesController = require('../controllers/salesController');
const { authMiddleware } = require('../middlewares/auth');

module.exports = () => {
    const router = express.Router();
    const salesController = new SalesController();

    router.use(authMiddleware);

    router.get('/', (req, res) => salesController.index(req, res));
    router.get('/:id', (req, res) => salesController.show(req, res));
    router.post('/', (req, res) => salesController.store(req, res));
    router.put('/:id', (req, res) => salesController.update(req, res));
    router.delete('/:id', (req, res) => salesController.destroy(req, res));

    return router;
};
