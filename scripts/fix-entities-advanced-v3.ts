import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

function fixEntityFile(filePath: string) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(path.basename(filePath), fileContent, ts.ScriptTarget.Latest, true);

    const requiredImports = [
      'import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";'
    ];

    let modifiedContent = fileContent;

    // Adicionar importações necessárias
    requiredImports.forEach(imp => {
      if (!modifiedContent.includes(imp)) {
        modifiedContent = imp + '\n' + modifiedContent;
      }
    });

    // Função para verificar se um nó é um decorador de classe
    function isClassDecorator(node: ts.Node): boolean {
      return ts.isDecorator(node) && 
             ts.isClassDeclaration(node.parent);
    }

    // Função para verificar se um nó é um decorador de propriedade
    function isPropertyDecorator(node: ts.Node): boolean {
      return ts.isDecorator(node) && 
             (ts.isPropertyDeclaration(node.parent) || ts.isMethodDeclaration(node.parent));
    }

    // Função para verificar se um nó é uma declaração de classe
    function isClassDeclaration(node: ts.Node): boolean {
      return ts.isClassDeclaration(node);
    }

    // Encontrar a declaração da classe
    const classDeclaration = sourceFile.statements.find(isClassDeclaration);

    if (classDeclaration) {
      const classStart = classDeclaration.pos;
      const classEnd = classDeclaration.end;

      // Verificar decoradores e propriedades fora da classe
      const decoratorsOutsideClass = sourceFile.statements.filter(node => 
        (isClassDecorator(node) || isPropertyDecorator(node)) && 
        (node.pos < classStart || node.pos > classEnd)
      );

      if (decoratorsOutsideClass.length > 0) {
        // Remover decoradores fora da classe
        decoratorsOutsideClass.forEach(decorator => {
          modifiedContent = modifiedContent.replace(decorator.getText(), '');
        });
      }
    }

    // Remover linhas em branco extras
    modifiedContent = modifiedContent.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync(filePath, modifiedContent);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error}`);
  }
}

function processEntitiesDirectory(dirPath: string) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile() && file.endsWith('.ts')) {
      fixEntityFile(fullPath);
    }
  });
}

const entitiesDir = path.join(__dirname, '..', 'src', 'entities');
processEntitiesDirectory(entitiesDir);
