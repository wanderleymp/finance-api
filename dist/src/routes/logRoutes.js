"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    try {
        const combinedLogPath = path_1.default.join(__dirname, '../../logs/combined.log');
        const errorLogPath = path_1.default.join(__dirname, '../../logs/error.log');
        // Ler logs combinados
        const combinedLogs = fs_1.default.existsSync(combinedLogPath)
            ? fs_1.default.readFileSync(combinedLogPath, 'utf-8').split('\n').filter(Boolean)
            : [];
        // Ler logs de erro
        const errorLogs = fs_1.default.existsSync(errorLogPath)
            ? fs_1.default.readFileSync(errorLogPath, 'utf-8').split('\n').filter(Boolean)
            : [];
        // Combinar e ordenar logs
        const allLogs = [...combinedLogs, ...errorLogs]
            .map(log => {
            try {
                return JSON.parse(log);
            }
            catch {
                return { message: log };
            }
        })
            .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .slice(0, 100); // Limitar a 100 logs mais recentes
        res.json({
            totalLogs: allLogs.length,
            logs: allLogs
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Erro ao recuperar logs',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=logRoutes.js.map