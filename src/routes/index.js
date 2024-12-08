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
const accountsReceivableRoutes = require('./accountsReceivableRoutes');
const messagingRoutes = require('./messagingRoutes');
const boletoRoutes = require('./boletoRoutes');
const installmentRoutes = require('./installmentRoutes');
const movementPaymentRoutes = require('./movementPaymentRoutes');
const tasksRoutes = require('./tasks');
const MovementController = require('../controllers/MovementController');
const TaskController = require('../controllers/TaskController');

// Test route to check if API is working
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Middleware de logging global no topo
router.use((req, res, next) => {
  console.log('\n=== NOVA REQUISIÇÃO ===');
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Middleware de logging para debug
router.use((req, res, next) => {
  logger.info('Requisição Recebida', {
    url: req.originalUrl,
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    body: req.body,
    headers: {
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });
  next();
});

// Auth routes
router.use('/auth', authRoutes);

// Rotas de usuários
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
console.log('DEBUG: Rotas de vendas registradas', 
    salesRoutes.stack.map(r => ({
        path: r.route?.path,
        method: r.route?.methods
    }))
);

// Purchases routes
router.use('/purchases', purchasesRoutes);

// Services routes
router.use('/services', servicesRoutes); // Nova rota

// Messaging routes
router.use('/messaging', messagingRoutes);

// Accounts Receivable routes
router.use('/accounts-receivable', accountsReceivableRoutes);

// Boleto route
router.use('/boleto', boletoRoutes);

// Installment routes
router.use('/installments', installmentRoutes);

// Movement Payment routes
router.use('/movement-payments', movementPaymentRoutes);

// Tasks routes
router.get('/tasks/failed', TaskController.listFailedTasks.bind(TaskController));
router.post('/tasks/:task_id/retry', TaskController.retryTask.bind(TaskController));
router.use('/tasks', tasksRoutes);

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
