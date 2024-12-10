"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_connection_string_1 = require("pg-connection-string");
// Tenta carregar .env
dotenv.config();
async function generateEntitiesFromDatabase() {
    const connectionOptions = (0, pg_connection_string_1.parse)(process.env.DATABASE_URL || '');
    const AppDataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: connectionOptions.host || 'localhost',
        port: parseInt(connectionOptions.port || '5432', 10),
        username: connectionOptions.user || 'postgres',
        password: connectionOptions.password || '',
        database: connectionOptions.database || 'finance_db',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true,
    });
    try {
        console.log('Tentando conectar com:', {
            host: connectionOptions.host,
            port: connectionOptions.port,
            database: connectionOptions.database
        });
        await AppDataSource.initialize();
        // Buscar todos os schemas
        const schemasResult = await AppDataSource.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
    `);
        const schemas = schemasResult.map((row) => row.schema_name);
        console.log('Schemas encontrados:', schemas);
        // Para cada schema, buscar as tabelas
        for (const schema of schemas) {
            const tablesResult = await AppDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
      `, [schema]);
            console.log(`Tabelas no schema ${schema}:`, tablesResult);
            for (const tableRow of tablesResult) {
                const tableName = tableRow.table_name;
                // Buscar colunas da tabela
                const columnsResult = await AppDataSource.query(`
          SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
        `, [schema, tableName]);
                console.log(`Colunas da tabela ${tableName}:`, columnsResult);
                // Gerar código da entidade
                const entityCode = generateEntityCode(schema, tableName, columnsResult);
                // Salvar arquivo de entidade
                const entityFileName = `${tableName.charAt(0).toUpperCase() + tableName.slice(1)}.ts`;
                const entityFilePath = path_1.default.join(__dirname, '..', 'src', 'entities', entityFileName);
                fs_1.default.writeFileSync(entityFilePath, entityCode);
                console.log(`Generated entity for ${tableName}`);
            }
        }
        await AppDataSource.destroy();
    }
    catch (error) {
        console.error('Error generating entities:', error);
        process.exit(1);
    }
}
function sanitizeColumnName(name) {
    // Remove caracteres especiais e substitui por underscores
    return name.replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^(\d)/, '_$1') // Prefixo com underscore se começar com número
        .replace(/_+/g, '_') // Substitui múltiplos underscores por um único
        .toLowerCase();
}
function sanitizeDefaultValue(defaultValue) {
    if (!defaultValue)
        return null;
    // Remove casting de tipo do PostgreSQL
    const cleanValue = defaultValue.replace(/::[\w\s]+/g, '')
        .replace(/'/g, '') // Remove aspas simples
        .trim();
    // Trata valores especiais
    switch (cleanValue.toLowerCase()) {
        case 'now()':
        case 'current_timestamp':
            return 'new Date()';
        case 'true':
        case 'false':
            return cleanValue;
        default:
            // Tenta converter para número ou manter como string
            return /^-?\d+(\.\d+)?$/.test(cleanValue) ? cleanValue : `'${cleanValue}'`;
    }
}
function generateEntityCode(schema, tableName, columns) {
    const className = tableName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const imports = new Set([
        "import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';"
    ]);
    const properties = [];
    const primaryKeyColumns = [];
    columns.forEach(col => {
        const originalColumnName = col.column_name;
        const propertyName = sanitizeColumnName(originalColumnName);
        let propertyType = 'string';
        const columnOptions = [];
        let decorator = '@Column()';
        // Mapeamento de tipos de dados
        switch (col.data_type) {
            case 'integer':
            case 'int':
            case 'smallint':
                propertyType = 'number';
                break;
            case 'bigint':
                propertyType = 'bigint';
                break;
            case 'boolean':
                propertyType = 'boolean';
                break;
            case 'timestamp':
            case 'timestamp without time zone':
            case 'date':
                propertyType = 'Date';
                break;
            case 'jsonb':
            case 'json':
                propertyType = 'any';
                break;
            case 'numeric':
            case 'real':
            case 'double precision':
                propertyType = 'number';
                break;
        }
        // Tratamento de nullable
        if (col.is_nullable === 'YES') {
            columnOptions.push('nullable: true');
        }
        // Tratamento de tamanho de caracteres
        if (col.character_maximum_length) {
            columnOptions.push(`length: ${col.character_maximum_length}`);
        }
        // Identificação de chave primária
        const primaryKeyNames = ['id', 'primaryKey', 'pk', 'version_id', 'log_id', 'script_id'];
        const isPrimaryKey = primaryKeyNames.some(name => originalColumnName.toLowerCase().includes(name)) ||
            (col.column_default && col.column_default.includes('nextval'));
        if (isPrimaryKey) {
            decorator = '@PrimaryGeneratedColumn()';
            primaryKeyColumns.push(propertyName);
        }
        // Tratamento de valor padrão
        const defaultValue = sanitizeDefaultValue(col.column_default);
        if (defaultValue) {
            columnOptions.push(`default: ${defaultValue}`);
        }
        // Geração do decorador
        const columnOptionsStr = columnOptions.length > 0
            ? `({ ${columnOptions.join(', ')} })`
            : '()';
        const decoratorLine = decorator.replace('()', columnOptionsStr);
        // Adiciona propriedade
        properties.push(`  ${decoratorLine}\n  ${propertyName}: ${propertyType};`);
    });
    // Adiciona CreateDateColumn e UpdateDateColumn se não existirem
    const hasCreatedAt = properties.some(prop => prop.includes('createdAt') || prop.includes('created_at'));
    const hasUpdatedAt = properties.some(prop => prop.includes('updatedAt') || prop.includes('updated_at'));
    if (!hasCreatedAt) {
        properties.push('  @CreateDateColumn()\n  createdAt: Date;');
    }
    if (!hasUpdatedAt) {
        properties.push('  @UpdateDateColumn()\n  updatedAt: Date;');
    }
    // Geração do código da entidade
    const entityCode = `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${tableName}')
export class ${className} {
${properties.join('\n\n')}
}`;
    return entityCode;
}
generateEntitiesFromDatabase();
//# sourceMappingURL=generate-entities.js.map