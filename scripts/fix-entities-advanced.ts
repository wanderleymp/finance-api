import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const entitiesDir = path.join(__dirname, '..', 'src', 'entities');

function fixEntityFile(filePath: string) {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  let modifiedCode = sourceCode;

  console.log('Processing file:', filePath);
  console.log('Initial source code:', sourceCode);

  // Função para substituir texto
  function replaceText(start: number, end: number, newText: string) {
    modifiedCode = modifiedCode.slice(0, start) + newText + modifiedCode.slice(end);
  }

  // Adicionar importações necessárias
  if (!sourceCode.includes('import {')) {
    modifiedCode = `import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';\n\n` + modifiedCode;
  }

  // Adicionar PrimaryGeneratedColumn e CreateDateColumn
  const lines = modifiedCode.split('\n');
  const classIndex = lines.findIndex(line => line.includes('@Entity('));
  
  if (classIndex !== -1) {
    const className = lines[classIndex].match(/@Entity\('?(\w+)'?\)/)?.[1] || 'default';
    const idColumnName = `${className}_id`;

    // Adicionar PrimaryGeneratedColumn se não existir
    if (!lines.some(line => line.includes('@PrimaryGeneratedColumn()'))) {
      lines.splice(classIndex + 1, 0, `  @PrimaryGeneratedColumn()\n  ${idColumnName}: number;`);
    }

    // Adicionar CreateDateColumn e UpdateDateColumn se não existirem
    if (!lines.some(line => line.includes('@CreateDateColumn()'))) {
      lines.push('', '  @CreateDateColumn()', '  created_at: Date;', '', '  @UpdateDateColumn()', '  updated_at: Date;');
    }

    // Corrigir decoradores de colunas
    lines.forEach((line, index) => {
      if (line.includes('@Column(')) {
        const columnMatch = line.match(/@Column\(([^)]*)\)\s*(\w+):\s*(\w+);/);
        if (columnMatch) {
          const [, optionsStr, propName, propType] = columnMatch;
          const isNullable = propType !== 'string';
          
          const newLine = `  @Column({ nullable: ${isNullable}${optionsStr ? `, ${optionsStr}` : ''} })\n  ${propName}: ${propType};`;
          lines[index] = newLine;
        }
      }
    });

    modifiedCode = lines.join('\n');
  }

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
