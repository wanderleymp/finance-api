const express = require('express');
const router = express.Router();
const usersRoutes = require('./users');
const logsRoutes = require('./logs');
const authRoutes = require('./auth');
const personsRoutes = require('./persons');
const contactRoutes = require('./contact');
const licenseRoutes = require('./licenseRoutes');
const paymentMethodRoutes = require('./paymentMethodRoutes');
const movementTypeRoutes = require('./movementTypeRoutes');
const movementStatusRoutes = require('./movementStatusRoutes');
const movementsRoutes = require('./movements');
const salesRoutes = require('./sales');
const purchasesRoutes = require('./purchases');

// Test route to check if API is working
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Auth routes
router.use('/auth', authRoutes);

// Users routes
router.use('/users', usersRoutes);

// Logs routes
router.use('/logs', logsRoutes);

// Persons routes
router.use('/persons', personsRoutes);

// Contact routes
router.use('/contacts', contactRoutes);

// License routes
router.use('/licenses', licenseRoutes);

// Payment methods routes
router.use('/payment-methods', paymentMethodRoutes);

// Movement types routes
router.use('/movement-types', movementTypeRoutes);

// Movement statuses routes
router.use('/movement-statuses', movementStatusRoutes);

// Movements routes
router.use('/movements', movementsRoutes);

// Sales routes
router.use('/sales', salesRoutes);

// Purchases routes
router.use('/purchases', purchasesRoutes);

// Rota de fallback para debug
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Can't find ${req.originalUrl} on this server!`,
    method: req.method,
    url: req.originalUrl,
    stack: new Error().stack
  });
});

module.exports = router;
