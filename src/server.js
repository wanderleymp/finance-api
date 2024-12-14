require('dotenv').config();
const app = require('./app');
const { logger } = require('./middlewares/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
});
