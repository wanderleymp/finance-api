import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const entitiesDir = path.join(__dirname, '..', 'src', 'entities');

function fixEntityFile(filePath: string) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  let modifiedCode = sourceCode;

  // Remover importações duplicadas
  const importLines = modifiedCode.split('\n').filter(line => line.startsWith('import '));
  const uniqueImportLines = [...new Set(importLines)];
  modifiedCode = modifiedCode.replace(importLines.join('\n'), uniqueImportLines.join('\n'));

  // Adicionar importações necessárias
  if (!modifiedCode.includes('import {')) {
    modifiedCode = `import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';\n\n` + modifiedCode;
  }

  // Função para extrair o nome da entidade
  function extractEntityName(code: string): string {
    const entityMatch = code.match(/@Entity\('?(\w+)'?\)/);
    return entityMatch ? entityMatch[1] : 'default';
  }

  // Função para adicionar decoradores e propriedades ausentes
  function fixEntityClass(code: string): string {
    const entityName = extractEntityName(code);
    const idColumnName = `${entityName}_id`;
    const lines = code.split('\n');
    const classIndex = lines.findIndex(line => line.includes('@Entity('));

    if (classIndex !== -1) {
      // Adicionar PrimaryGeneratedColumn se não existir
      if (!lines.some(line => line.includes('@PrimaryGeneratedColumn()'))) {
        lines.splice(classIndex + 1, 0, `  @PrimaryGeneratedColumn()\n  ${idColumnName}: number;`);
      }

      // Adicionar CreateDateColumn e UpdateDateColumn se não existirem
      if (!lines.some(line => line.includes('@CreateDateColumn()'))) {
        lines.push('', '  @CreateDateColumn()', '  created_at: Date;', '', '  @UpdateDateColumn()', '  updated_at: Date;');
      }

      // Corrigir decoradores de colunas
      const updatedLines = lines.map(line => {
        const columnMatch = line.match(/@Column\(([^)]*)\)\s*(\w+):\s*(\w+);/);
        if (columnMatch) {
          const [, optionsStr, propName, propType] = columnMatch;
          const isNullable = propType !== 'string';
          
          return `  @Column({ nullable: ${isNullable}${optionsStr ? `, ${optionsStr}` : ''} })\n  ${propName}: ${propType};`;
        }
        return line;
      });

      // Remover propriedades duplicadas
      const uniqueProps = new Set();
      const cleanedLines = updatedLines.filter(line => {
        const propMatch = line.match(/^\s*(\w+):/);
        if (propMatch) {
          const prop = propMatch[1];
          if (uniqueProps.has(prop)) {
            return false;
          }
          uniqueProps.add(prop);
        }
        return true;
      });

      return cleanedLines.join('\n');
    }

    return code;
  }

  // Aplicar correções
  modifiedCode = fixEntityClass(modifiedCode);

  // Remover linhas em branco duplicadas
  modifiedCode = modifiedCode.replace(/\n{3,}/g, '\n\n');

  // Escrever código modificado
  fs.writeFileSync(filePath, modifiedCode);
  console.log(`Fixed: ${filePath}`);
}

function processEntities() {
  const files = fs.readdirSync(entitiesDir)
    .filter(file => file.endsWith('.ts') && !file.startsWith('index'));

  files.forEach(file => {
    const fullPath = path.join(entitiesDir, file);
    fixEntityFile(fullPath);
  });
}

processEntities();
