const express = require('express');
const router = express.Router();
const logger = require('../../config/logger');
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
const servicesRoutes = require('./services'); // Nova importação

// Test route to check if API is working
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Middleware de logging para debug
router.use((req, res, next) => {
  console.log('\n=== MAIN ROUTER DEBUG ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', req.headers);
  console.log('Request Params:', req.params);
  console.log('Request Query:', req.query);
  console.log('Request Body:', req.body);
  console.log('Base URL:', req.baseUrl);
  console.log('Route Stack:', router.stack.map(layer => ({
    regexp: layer.regexp.toString(),
    path: layer.route?.path,
    methods: layer.route?.methods
  })));
  console.log('=== END MAIN ROUTER DEBUG ===\n');

  logger.info('Rota sendo processada:', {
    originalUrl: req.originalUrl,
    method: req.method,
    headers: req.headers,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
    baseUrl: req.baseUrl,
    stack: new Error().stack
  });
  next();
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

// Services routes
router.use('/services', servicesRoutes); // Nova rota

// Rota de fallback para debug
router.use((req, res, next) => {
  console.log('\n=== 404 ERROR DEBUG ===');
  console.log('Not Found URL:', req.originalUrl);
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('=== END 404 DEBUG ===\n');

  logger.error('Rota não encontrada:', {
    originalUrl: req.originalUrl,
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers,
    stack: new Error().stack
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Can't find ${req.originalUrl} on this server!`,
    method: req.method,
    url: req.originalUrl,
    stack: new Error().stack
  });
});

module.exports = router;
