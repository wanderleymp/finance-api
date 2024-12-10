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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// Carregar variáveis de ambiente de forma explícita
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });
async function regenerateEntities() {
    // Usar a URL do banco de dados do .env
    const databaseUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', databaseUrl); // Log para depuração
    if (!databaseUrl) {
        console.error('DATABASE_URL não configurada');
        process.exit(1);
    }
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        url: databaseUrl,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: true, // Ativar logging para mais detalhes
    });
    try {
        await dataSource.initialize();
        // Limpar diretório de entidades
        const entitiesDir = path.join(__dirname, '..', 'src', 'entities');
        fs.readdirSync(entitiesDir)
            .filter(file => file.endsWith('.ts') && !file.startsWith('index'))
            .forEach(file => {
            fs.unlinkSync(path.join(entitiesDir, file));
        });
        console.log('Diretório de entidades limpo.');
        // Obter todas as tabelas do banco de dados
        const queryRunner = dataSource.createQueryRunner();
        const tables = await queryRunner.getTables();
        // Filtrar tabelas relevantes (excluir tabelas de sistema e de informação)
        const relevantTables = tables.filter(table => !table.name.startsWith('pg_') &&
            !table.name.startsWith('sql_') &&
            !table.name.startsWith('information_schema'));
        // Gerar entidades para cada tabela
        for (const table of relevantTables) {
            const className = table.name
                .split('.')
                .map(part => part.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(''))
                .join('')
                .replace(/^(\d)/, '_$1');
            let entityCode = `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';\n\n`;
            entityCode += `@Entity('${table.name}')\n`;
            entityCode += `export class ${className} {\n`;
            const generateColumnDecorator = (column) => {
                const decoratorOptions = [];
                if (column.is_nullable === 'NO') {
                    decoratorOptions.push('nullable: false');
                }
                if (column.column_name.toLowerCase().endsWith('_id') || column.column_name === 'id') {
                    decoratorOptions.push('primary: true');
                }
                if (column.character_maximum_length) {
                    decoratorOptions.push(`length: ${column.character_maximum_length}`);
                }
                if (column.column_default) {
                    decoratorOptions.push(`default: ${column.column_default}`);
                }
                const optionsStr = decoratorOptions.length > 0
                    ? `{ ${decoratorOptions.join(', ')} }`
                    : '';
                return `@Column(${optionsStr})`;
            };
            const mapTypeOrmType = (dataType, column) => {
                switch (dataType) {
                    case 'integer':
                    case 'smallint':
                    case 'bigint':
                        return column.column_name.toLowerCase().endsWith('_id') ? 'number' : 'number';
                    case 'numeric':
                    case 'real':
                    case 'double precision':
                        return 'number';
                    case 'character varying':
                    case 'text':
                    case 'character':
                        return 'string';
                    case 'boolean':
                        return 'boolean';
                    case 'date':
                    case 'timestamp without time zone':
                    case 'timestamp with time zone':
                        return 'Date';
                    case 'json':
                    case 'jsonb':
                        return 'any';
                    default:
                        return 'any';
                }
            };
            const generatePrimaryKeyDecorator = (column) => {
                if (column.column_name.toLowerCase().endsWith('_id') || column.column_name === 'id') {
                    return '@PrimaryColumn()';
                }
                return '';
            };
            const generateAutoIncrementDecorator = (column) => {
                if (column.column_default && column.column_default.includes('nextval')) {
                    return '@PrimaryGeneratedColumn()';
                }
                return '';
            };
            const generateCreateDateDecorator = (column) => {
                if (column.column_name === 'created_at') {
                    return '@CreateDateColumn()';
                }
                return '';
            };
            const generateUpdateDateDecorator = (column) => {
                if (column.column_name === 'updated_at') {
                    return '@UpdateDateColumn()';
                }
                return '';
            };
            // Adicionar colunas
            for (const column of table.columns) {
                const columnName = column.name;
                const columnType = column.type;
                const tsType = mapTypeOrmType(columnType, column);
                const columnDecorator = generateColumnDecorator(column);
                const primaryKeyDecorator = generatePrimaryKeyDecorator(column);
                const autoIncrementDecorator = generateAutoIncrementDecorator(column);
                const createDateDecorator = generateCreateDateDecorator(column);
                const updateDateDecorator = generateUpdateDateDecorator(column);
                entityCode += `  ${primaryKeyDecorator}\n`;
                entityCode += `  ${autoIncrementDecorator}\n`;
                entityCode += `  ${columnDecorator}\n`;
                entityCode += `  ${createDateDecorator}\n`;
                entityCode += `  ${updateDateDecorator}\n`;
                entityCode += `  ${columnName}: ${tsType};\n\n`;
            }
            entityCode += `}\n`;
            // Salvar arquivo de entidade
            const entityFilePath = path.join(entitiesDir, `${className}.ts`);
            fs.writeFileSync(entityFilePath, entityCode);
            console.log(`Gerada entidade: ${entityFilePath}`);
        }
        await queryRunner.release();
        await dataSource.destroy();
        console.log('Regeneração de entidades concluída.');
    }
    catch (error) {
        console.error('Erro na regeneração de entidades:', error);
        process.exit(1);
    }
}
regenerateEntities();
//# sourceMappingURL=regenerate-entities.js.map