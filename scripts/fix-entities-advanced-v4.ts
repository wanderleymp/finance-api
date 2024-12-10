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

    // Transformar o código fonte em uma árvore sintática
    function transform(context: ts.TransformationContext) {
      return (rootNode: ts.SourceFile) => {
        function visit(node: ts.Node): ts.Node {
          // Remover decoradores fora da classe
          if (ts.isDecorator(node) && 
              (!ts.isClassDeclaration(node.parent) && 
               !ts.isPropertyDeclaration(node.parent) && 
               !ts.isMethodDeclaration(node.parent))) {
            return undefined;
          }

          // Remover declarações de propriedades fora da classe
          if ((ts.isPropertyDeclaration(node) || ts.isMethodDeclaration(node)) && 
              !ts.isClassDeclaration(node.parent)) {
            return undefined;
          }

          return ts.visitEachChild(node, visit, context);
        }

        return ts.visitNode(rootNode, visit);
      };
    }

    // Aplicar a transformação
    const transformationResult = ts.transform(sourceFile, [transform]);
    const transformedSourceFile = transformationResult.transformed[0];

    // Gerar o código modificado
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const modifiedSourceCode = printer.printNode(
      ts.EmitHint.SourceFile, 
      transformedSourceFile, 
      sourceFile
    );

    // Remover linhas em branco extras
    const finalContent = modifiedSourceCode.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync(filePath, finalContent);
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
