const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middlewares/errorHandler');
const container = require('./config/container');

const app = express();

// Configurações básicas
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware para todas as requisições
// app.use((req, res, next) => {
//     logger.info('Requisição recebida', {
//         method: req.method,
//         url: req.url,
//         ip: req.ip,
//         userAgent: req.get('user-agent')
//     });
//     next();
// });

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
const boletoController = container.resolve('boletoController');
const installmentController = container.resolve('installmentController');
const movementPaymentController = container.resolve('movementPaymentController');
const movementController = container.resolve('movementController');

app.use('/boletos', require('./modules/boletos/boleto.routes')(boletoController));
app.use('/installments', require('./modules/installments/installment.routes')(installmentController));
app.use('/movement-payments', require('./modules/movement-payments/movement-payment.routes')(movementPaymentController));
app.use('/movements', require('./modules/movements/movement.routes')(movementController));

// Tratamento de erros global
app.use(errorHandler);

// Inicia o worker de processamento de tarefas
// tasksWorker.start().catch(error => {
//     logger.error('Erro ao iniciar worker de tarefas', {
//         error: error.message
//     });
// });

module.exports = app;
