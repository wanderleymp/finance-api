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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ts = __importStar(require("typescript"));
function fixEntityFile(filePath) {
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
        function transform(context) {
            return (rootNode) => {
                function visit(node) {
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
        const modifiedSourceCode = printer.printNode(ts.EmitHint.SourceFile, transformedSourceFile, sourceFile);
        // Remover linhas em branco extras
        const finalContent = modifiedSourceCode.replace(/^\s*[\r\n]/gm, '');
        fs.writeFileSync(filePath, finalContent);
        console.log(`Fixed: ${filePath}`);
    }
    catch (error) {
        console.error(`Error processing ${filePath}: ${error}`);
    }
}
function processEntitiesDirectory(dirPath) {
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
//# sourceMappingURL=fix-entities-advanced-v4.js.map