import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { parse } from 'pg-connection-string';

// Tenta carregar .env
dotenv.config();

async function generateEntitiesFromDatabase() {
  const connectionOptions = parse(process.env.DATABASE_URL || '');
  
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: connectionOptions.host || 'localhost',
    port: parseInt(connectionOptions.port || '5432', 10),
    username: connectionOptions.user || 'postgres',
    password: connectionOptions.password || '',
    database: connectionOptions.database || 'finance_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: true,
  } as any);

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
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'model')
    `);

    const schemas = schemasResult.map((row: any) => row.schema_name);
    console.log('Schemas encontrados:', schemas);

    // Para cada schema, buscar as tabelas
    for (const schema of schemas) {
      const tablesResult = await AppDataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
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

        // Criar diretório de entidades se não existir
        const entitiesDir = path.join(__dirname, '..', 'src', 'entities');
        if (!fs.existsSync(entitiesDir)) {
          fs.mkdirSync(entitiesDir, { recursive: true });
        }

        // Salvar arquivo da entidade
        const fileName = `${sanitizeClassName(tableName)}.ts`;
        const filePath = path.join(entitiesDir, fileName);
        
        fs.writeFileSync(filePath, entityCode);
        console.log(`Generated entity for ${tableName}`);
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error generating entities:', error);
    process.exit(1);
  }
}

function sanitizeClassName(name: string): string {
  // Converter para PascalCase e remover caracteres especiais
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function sanitizeColumnName(name: string): string {
  // Remove caracteres especiais e substitui por underscores
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^(\d)/, '_$1')  // Prefixo com underscore se começar com número
    .replace(/_+/g, '_')      // Substitui múltiplos underscores por um único
    .toLowerCase();
}

function sanitizeDefaultValue(defaultValue: string | null): string | null {
  if (!defaultValue) return null;

  // Remove casting de tipo do PostgreSQL
  const cleanValue = defaultValue.replace(/::[\w\s]+/g, '')
    .replace(/'/g, '')  // Remove aspas simples
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

function generateEntityCode(schema: string, tableName: string, columns: any[]) {
  const className = tableName.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');
  
  const imports = new Set([
    "import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';"
  ]);
  
  const properties: string[] = [];
  const primaryKeyColumns: string[] = [];

  columns.forEach(col => {
    const originalColumnName = col.column_name;
    const propertyName = sanitizeColumnName(originalColumnName);
    let propertyType = 'string';
    const columnOptions: string[] = [];
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
    const isPrimaryKey = 
      primaryKeyNames.some(name => originalColumnName.toLowerCase().includes(name)) ||
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
