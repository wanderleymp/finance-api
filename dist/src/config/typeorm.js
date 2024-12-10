"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataSourceOptions = exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === 'production';
const dataSourceOptions = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Configurações de SSL para produção
    ssl: isProduction ? {
        rejectUnauthorized: false,
        ca: process.env.DB_SSL_CA // Opcional: certificado CA se necessário
    } : false,
    // Desabilitar sincronização automática
    synchronize: false,
    // Não executar migrações automaticamente
    migrationsRun: false,
    // Configurações de log detalhadas
    logging: isProduction
        ? ['error', 'warn']
        : ['query', 'schema', 'error', 'warn', 'info', 'log'],
    // Caminho absoluto para entidades
    entities: [
        path_1.default.join(__dirname, '..', 'entities', '**', '*.{ts,js}')
    ],
    // Caminho absoluto para migrações
    migrations: [
        path_1.default.join(__dirname, '..', 'migrations', '**', '*.{ts,js}')
    ],
    // Configurações adicionais de conexão
    connectTimeoutMS: 5000,
    maxQueryExecutionTime: 5000, // 5 segundos
    // Pooling de conexões
    poolSize: isProduction ? 10 : 5,
    extra: {
        connectionLimit: isProduction ? 10 : 5,
    }
};
exports.dataSourceOptions = dataSourceOptions;
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
async function initializeDatabase() {
    try {
        console.log('Inicializando conexão com banco de dados...');
        console.log('Configurações:', {
            host: dataSourceOptions.url?.split('@')[1]?.split(':')[0],
            database: dataSourceOptions.url?.split('/')?.pop(),
            ssl: !!dataSourceOptions.ssl,
            logging: dataSourceOptions.logging
        });
        await exports.AppDataSource.initialize();
        console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    }
    catch (error) {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=typeorm.js.map