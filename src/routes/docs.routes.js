const express = require('express');
const swagger = require('../config/swagger');

const router = express.Router();

// Rota da documentação
router.use('/', swagger.serve);
router.get('/', swagger.setup);

module.exports = router;
