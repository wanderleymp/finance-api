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
const databaseController = require('../controllers/databaseController');

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
