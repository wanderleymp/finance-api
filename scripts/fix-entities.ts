import * as fs from 'fs';
import * as path from 'path';

const entitiesDir = path.join(__dirname, '..', 'src', 'entities');

function fixEntityFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Adicionar importações necessárias se não existirem
  if (!content.includes('import {')) {
    content = `import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';\n\n` + content;
  }

  // Adicionar PrimaryGeneratedColumn se não existir
  if (!content.includes('@PrimaryGeneratedColumn()')) {
    const classMatch = content.match(/@Entity\([^)]+\)\nexport class (\w+) {/);
    if (classMatch) {
      const className = classMatch[1];
      const idColumnName = className.toLowerCase().replace('_', '') + '_id';
      
      content = content.replace(
        /@Entity\([^)]+\)\nexport class (\w+) {/,
        `@Entity('${className.toLowerCase()}')
export class ${className} {
  @PrimaryGeneratedColumn()
  ${idColumnName}: number;\n`
      );
    }
  }

  // Corrigir decoradores de colunas
  content = content.replace(
    /@Column\(([^)]*)\)\s*(\w+):\s*(\w+);/g, 
    (match, optionsStr, propName, type) => {
      let options = {};
      try {
        options = optionsStr ? eval(`(${optionsStr})`) : {};
      } catch (e) {
        options = {};
      }
      
      const newOptions = {
        ...options,
        nullable: options['nullable'] ?? (type === 'string' ? false : true)
      };
      
      return `@Column(${JSON.stringify(newOptions)})
  ${propName}: ${type};`;
    }
  );

  // Adicionar CreateDateColumn e UpdateDateColumn se não existirem
  if (!content.includes('@CreateDateColumn()')) {
    content = content.replace(
      /}$/,
      `\n  @CreateDateColumn()
  created_at: Date;\n\n  @UpdateDateColumn()
  updated_at: Date;\n}`
    );
  }

  fs.writeFileSync(filePath, content);
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
