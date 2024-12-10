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
const entitiesDir = path.join(__dirname, '..', 'src', 'entities');
function fixEntityFile(filePath) {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);
    let modifiedCode = sourceCode;
    console.log('Processing file:', filePath);
    console.log('Initial source code:', sourceCode);
    // Função para substituir texto
    function replaceText(start, end, newText) {
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
//# sourceMappingURL=fix-entities-advanced.js.map