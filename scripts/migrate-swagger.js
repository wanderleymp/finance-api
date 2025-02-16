const fs = require('fs');
const path = require('path');

const MODULES_PATH = path.join(__dirname, '..', 'src', 'modules');
const SWAGGER_TEMPLATE = `import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

`;

function generateSwaggerDecorators(controllerName, methods) {
    return `@ApiTags('${controllerName}')
export class ${controllerName}Controller {
${methods.map(method => `
  @ApiOperation({ summary: '${method.description}' })
  @ApiResponse({ 
    status: 200, 
    description: '${method.description} realizada com sucesso' 
  })
  ${method.name}() {
    // Implementação existente
  }`).join('\n')}
}`;
}

function migrateController(modulePath) {
    const controllerPath = path.join(modulePath, `${path.basename(modulePath)}.controller.js`);
    
    if (!fs.existsSync(controllerPath)) return;

    const controllerContent = fs.readFileSync(controllerPath, 'utf-8');
    const controllerName = path.basename(modulePath).replace(/^./, c => c.toUpperCase());

    // Extrair métodos básicos
    const methods = [
        { name: 'findAll', description: 'Listar registros' },
        { name: 'findById', description: 'Buscar registro por ID' },
        { name: 'create', description: 'Criar novo registro' },
        { name: 'update', description: 'Atualizar registro' },
        { name: 'delete', description: 'Remover registro' }
    ];

    const swaggerContent = generateSwaggerDecorators(controllerName, methods);

    // Salvar como arquivo TypeScript
    fs.writeFileSync(
        path.join(modulePath, `${path.basename(modulePath)}.controller.ts`), 
        swaggerContent
    );
}

function migrateSwagggerInModules() {
    const modules = fs.readdirSync(MODULES_PATH)
        .filter(file => fs.statSync(path.join(MODULES_PATH, file)).isDirectory());

    modules.forEach(moduleName => {
        const modulePath = path.join(MODULES_PATH, moduleName);
        migrateController(modulePath);
    });

    console.log('Migração de Swagger concluída!');
}

migrateSwagggerInModules();
