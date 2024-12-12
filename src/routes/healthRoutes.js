const express = require('express');
const { devDatabase, systemDatabase } = require('../config/database');
const os = require('os');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Testar conexões com bancos de dados
    const devDbTest = await devDatabase.testConnection();
    const systemDbTest = await systemDatabase.testConnection();

    // Informações do sistema
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
    };

    // Preparar resposta
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: {
        dev_history: devDbTest,
        AgileDB: systemDbTest
      },
      system: systemInfo
    };

    // Definir código de status baseado na saúde dos bancos de dados
    const httpStatus = 
      devDbTest.success && systemDbTest.success ? 200 : 503;

    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during health check',
      error: error.message
    });
  }
});

module.exports = router;
