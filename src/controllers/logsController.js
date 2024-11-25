const fs = require('fs').promises;
const path = require('path');

class LogsController {
    async getLogs(req, res) {
        try {
            const logType = req.query.type || 'combined'; // 'combined' ou 'error'
            const lines = parseInt(req.query.lines) || 100; // número de linhas para retornar
            
            const logPath = path.join(process.cwd(), 'logs', `${logType}.log`);
            
            const fileContent = await fs.readFile(logPath, 'utf8');
            const logLines = fileContent.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch {
                        return line;
                    }
                })
                .slice(-lines);

            res.json({
                type: logType,
                lines: logLines.length,
                logs: logLines
            });
        } catch (error) {
            res.status(500).json({
                error: 'Erro ao ler os logs',
                details: error.message,
                availableTypes: ['combined', 'error']
            });
        }
    }
}

module.exports = LogsController;
