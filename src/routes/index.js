const express = require('express');
const personRoutes = require('./personRoutes');
const personDocumentRoutes = require('./personDocumentRoutes');
const contactRoutes = require('./contactRoutes');
const personContactRoutes = require('./personContactRoutes');
const personAddressRoutes = require('./personAddressRoutes');
const licenseRoutes = require('./licenseRoutes');
const userRoutes = require('./userRoutes');
const personCnpjRoutes = require('./personCnpjRoutes');
const itemRoutes = require('./itemRoutes');
const movementPaymentsRoutes = require('./movementPaymentsRoutes');
const databaseController = require('../controllers/databaseController');
const installmentController = require('../controllers/installmentController');
const installmentRoutes = require('./installmentRoutes');

const router = express.Router();

// Debug middleware para log de rotas
router.use((req, res, next) => {
    console.log('Rota recebida:', req.method, req.path);
    console.log('Todas as rotas registradas:', router.stack.map(r => {
        if (r.route) {
            return `${r.route.stack[0].method.toUpperCase()} ${r.route.path}`;
        }
        return 'middleware';
    }));
    next();
});

// Rotas de pessoas
router.use('/persons', personRoutes);
router.use('/persons/cnpjs', personCnpjRoutes);
router.use('/person-documents', personDocumentRoutes);
router.use('/contacts', contactRoutes);
router.use('/person-contacts', personContactRoutes);
router.use('/person-addresses', personAddressRoutes);
router.use('/licenses', licenseRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/movement-payments', movementPaymentsRoutes);

// Rotas de installments
router.use('/installments', installmentRoutes);

// Rotas de debug de banco de dados
router.get('/db/table-schema/:tableName', databaseController.getTableSchema);
router.get('/db/table-data/:tableName', databaseController.getTableData);

// Rota de teste simples de items
router.get('/test-items', (req, res) => {
    res.json({ 
        message: 'Rota de teste de items funcionando',
        routes: router.stack.map(r => {
            if (r.route) return `${r.route.stack[0].method.toUpperCase()} ${r.route.path}`;
            return 'middleware';
        })
    });
});

console.log('ROTAS REGISTRADAS:', router.stack.map(r => {
    if (r.route) return `${r.route.stack[0].method.toUpperCase()} ${r.route.path}`;
    return 'middleware';
}));

module.exports = router;
