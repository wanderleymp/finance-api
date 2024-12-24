const TaskRoutes = require('./task.routes');
const TaskController = require('./task.controller');
const TaskService = require('./services/task.service');
const TaskRepository = require('./repositories/task.repository');
const TaskWorker = require('./workers/task.worker');
const TaskMonitor = require('./monitoring/monitor');
const TaskMetrics = require('./monitoring/metrics');
const { logger } = require('../../middlewares/logger');

class TaskModule {
    constructor() {
        // Inicializar componentes
        this.repository = new TaskRepository();
        this.service = new TaskService({ taskRepository: this.repository });
        this.controller = new TaskController(this.service);
        this.routes = TaskRoutes;

        // Inicializar worker
        this.worker = new TaskWorker({
            taskService: this.service,
            interval: 1000,
            batchSize: 10
        });

        // Inicializar monitor
        this.monitor = new TaskMonitor({
            taskService: this.service,
            checkInterval: 60000,
            thresholds: {
                pendingTasks: 100,
                failedTasks: 50,
                processingTime: 300000
            }
        });

        // Inicializar metrics
        this.metrics = new TaskMetrics();
    }

    register(app) {
        logger.info('Registrando módulo de tasks');

        // Registra as rotas
        app.use('/tasks', this.routes.getRouter());

        // Inicia o worker e monitor
        this.worker.start();
        this.monitor.start();

        // Registra métricas
        this.metrics.register();

        logger.info('Módulo de tasks registrado com sucesso');
    }
}

module.exports = new TaskModule();
