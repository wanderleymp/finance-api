"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = exports.getEnv = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Carrega as variáveis de ambiente do arquivo .env
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), '.env')
});
// Função para obter variáveis de ambiente com valor padrão
const getEnv = (key, defaultValue) => {
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        throw new Error(`Variável de ambiente ${key} não definida`);
    }
    return value;
};
exports.getEnv = getEnv;
// Exportar variáveis de ambiente principais
exports.ENV = {
    DATABASE_URL: (0, exports.getEnv)('DATABASE_URL'),
    PORT: (0, exports.getEnv)('PORT', '3000'),
    NODE_ENV: (0, exports.getEnv)('NODE_ENV', 'development'),
    JWT_SECRET: (0, exports.getEnv)('JWT_SECRET')
};
//# sourceMappingURL=env.js.map