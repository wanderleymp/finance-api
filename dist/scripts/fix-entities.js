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
const entitiesDir = path.join(__dirname, '..', 'src', 'entities');
function fixEntityFile(filePath) {
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
            content = content.replace(/@Entity\([^)]+\)\nexport class (\w+) {/, `@Entity('${className.toLowerCase()}')
export class ${className} {
  @PrimaryGeneratedColumn()
  ${idColumnName}: number;\n`);
        }
    }
    // Corrigir decoradores de colunas
    content = content.replace(/@Column\(([^)]*)\)\s*(\w+):\s*(\w+);/g, (match, optionsStr, propName, type) => {
        let options = {};
        try {
            options = optionsStr ? eval(`(${optionsStr})`) : {};
        }
        catch (e) {
            options = {};
        }
        const newOptions = {
            ...options,
            nullable: options['nullable'] ?? (type === 'string' ? false : true)
        };
        return `@Column(${JSON.stringify(newOptions)})
  ${propName}: ${type};`;
    });
    // Adicionar CreateDateColumn e UpdateDateColumn se não existirem
    if (!content.includes('@CreateDateColumn()')) {
        content = content.replace(/}$/, `\n  @CreateDateColumn()
  created_at: Date;\n\n  @UpdateDateColumn()
  updated_at: Date;\n}`);
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
//# sourceMappingURL=fix-entities.js.map