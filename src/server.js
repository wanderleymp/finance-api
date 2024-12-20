require('dotenv').config();
const app = require('./app');
const { logger } = require('./middlewares/logger');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Função para ler informações de versão
function getAppVersion() {
    try {
        const versionPath = path.resolve(__dirname, '../VERSION');
        const versionContent = fs.readFileSync(versionPath, 'utf-8');
        return versionContent.split('\n').reduce((acc, line) => {
            const [key, value] = line.split('=');
            acc[key] = value;
            return acc;
        }, {});
    } catch (error) {
        console.error('Erro ao ler arquivo de versão:', error);
        return { version: 'unknown', branch: 'unknown' };
    }
}

const appVersion = getAppVersion();

app.listen(PORT, () => {
    logger.info(`🚀 Servidor inicializado`, {
        port: PORT,
        version: appVersion.version,
        branch: appVersion.branch,
        buildDate: appVersion.build_date,
        environment: process.env.NODE_ENV
    });
});
