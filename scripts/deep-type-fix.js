const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function modifySourceFile(sourceFile) {
  const transformations = [];

  function visit(node) {
    // Ajustar tipos de criação de usuário
    if (ts.isObjectLiteralExpression(node)) {
      const properties = node.properties.map(prop => {
        if (ts.isPropertyAssignment(prop)) {
          const name = prop.name.getText();
          if (name === 'user_name' && ts.isIdentifier(prop.initializer)) {
            return ts.factory.createPropertyAssignment(
              prop.name,
              ts.factory.createStringLiteral(prop.initializer.getText())
            );
          }
          if (name === 'role' && ts.isIdentifier(prop.initializer)) {
            return ts.factory.createPropertyAssignment(
              prop.name,
              ts.factory.createStringLiteral(prop.initializer.getText())
            );
          }
        }
        return prop;
      });

      return ts.factory.updateObjectLiteralExpression(node, properties);
    }

    return ts.visitEachChild(node, visit, ts.nullTransformationContext);
  }

  const transformed = ts.visitNode(sourceFile, visit);
  return transformed;
}

function processTypeScriptFile(filePath) {
  const program = ts.createProgram([filePath], { strict: false });
  const sourceFile = program.getSourceFile(filePath);

  if (sourceFile) {
    const transformedSourceFile = modifySourceFile(sourceFile);
    
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printNode(
      ts.EmitHint.SourceFile, 
      transformedSourceFile, 
      sourceFile
    );

    fs.writeFileSync(filePath, result);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  files.forEach(file => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      try {
        processTypeScriptFile(fullPath);
        console.log(`Processado: ${fullPath}`);
      } catch (error) {
        console.error(`Erro ao processar ${fullPath}:`, error);
      }
    }
  });
}

processDirectory(path.join(__dirname, '..', 'src'));
console.log('Processamento de tipos concluído!');
