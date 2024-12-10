"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Finance API',
        version: '1.1.2',
        description: 'API de gerenciamento financeiro com autenticação e tarefas',
        contact: {
            name: 'Suporte Técnico',
            email: 'suporte@financeapi.com'
        }
    },
    servers: [
        {
            url: 'http://162.55.160.99:3000',
            description: 'Servidor de desenvolvimento'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    }
};
const options = {
    swaggerDefinition,
    apis: [
        './src/routes/*.ts',
        './src/routes/**/*.ts',
        './src/controllers/*.ts',
        './src/controllers/**/*.ts'
    ]
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
