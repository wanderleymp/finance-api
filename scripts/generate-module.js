const fs = require('fs');
const path = require('path');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateModule(moduleName) {
    const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
    const moduleNameCapitalized = capitalizeFirstLetter(moduleName);

    // Criar diretório do módulo
    if (!fs.existsSync(modulePath)) {
        fs.mkdirSync(modulePath, { recursive: true });
    }

    // DTO
    const dtoContent = `import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Create${moduleNameCapitalized}Dto {
    @ApiProperty({ description: 'Nome do ${moduleName}' })
    @IsNotEmpty()
    @IsString()
    name: string;
}

export class ${moduleNameCapitalized}ResponseDto {
    @ApiProperty({ description: 'ID do ${moduleName}' })
    id: number;

    @ApiProperty({ description: 'Nome do ${moduleName}' })
    name: string;
}`;
    fs.writeFileSync(path.join(modulePath, `${moduleName}.dto.ts`), dtoContent);

    // Controller
    const controllerContent = `import { 
    Controller, 
    Post, 
    Get, 
    Put, 
    Delete, 
    Body, 
    Param 
} from '@nestjs/common';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBody 
} from '@nestjs/swagger';
import { Create${moduleNameCapitalized}Dto, ${moduleNameCapitalized}ResponseDto } from './${moduleName}.dto';
import { ${moduleNameCapitalized}Service } from './${moduleName}.service';

@ApiTags('${moduleNameCapitalized}')
@Controller('${moduleName}')
export class ${moduleNameCapitalized}Controller {
    constructor(private readonly ${moduleName}Service: ${moduleNameCapitalized}Service) {}

    @Post()
    @ApiOperation({ summary: 'Criar novo ${moduleName}' })
    @ApiBody({ type: Create${moduleNameCapitalized}Dto })
    @ApiResponse({ 
        status: 201, 
        description: '${moduleName} criado com sucesso',
        type: ${moduleNameCapitalized}ResponseDto 
    })
    async create(@Body() create${moduleNameCapitalized}Dto: Create${moduleNameCapitalized}Dto): Promise<${moduleNameCapitalized}ResponseDto> {
        return this.${moduleName}Service.create(create${moduleNameCapitalized}Dto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os ${moduleName}s' })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista de ${moduleName}s',
        type: [${moduleNameCapitalized}ResponseDto] 
    })
    async findAll(): Promise<${moduleNameCapitalized}ResponseDto[]> {
        return this.${moduleName}Service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar ${moduleName} por ID' })
    @ApiResponse({ 
        status: 200, 
        description: '${moduleName} encontrado',
        type: ${moduleNameCapitalized}ResponseDto 
    })
    @ApiResponse({ 
        status: 404, 
        description: '${moduleName} não encontrado' 
    })
    async findById(@Param('id') id: number): Promise<${moduleNameCapitalized}ResponseDto> {
        return this.${moduleName}Service.findById(id);
    }
}`;
    fs.writeFileSync(path.join(modulePath, `${moduleName}.controller.ts`), controllerContent);

    // Service
    const serviceContent = `import { Injectable } from '@nestjs/common';
import { Create${moduleNameCapitalized}Dto, ${moduleNameCapitalized}ResponseDto } from './${moduleName}.dto';

@Injectable()
export class ${moduleNameCapitalized}Service {
    async create(create${moduleNameCapitalized}Dto: Create${moduleNameCapitalized}Dto): Promise<${moduleNameCapitalized}ResponseDto> {
        // Implementação de criação
        return { id: 1, ...create${moduleNameCapitalized}Dto };
    }

    async findAll(): Promise<${moduleNameCapitalized}ResponseDto[]> {
        // Implementação de listagem
        return [];
    }

    async findById(id: number): Promise<${moduleNameCapitalized}ResponseDto> {
        // Implementação de busca por ID
        return { id, name: 'Exemplo' };
    }
}`;
    fs.writeFileSync(path.join(modulePath, `${moduleName}.service.ts`), serviceContent);

    // Routes (opcional, dependendo da estrutura)
    const routesContent = `import { Module } from '@nestjs/common';
import { ${moduleNameCapitalized}Controller } from './${moduleName}.controller';
import { ${moduleNameCapitalized}Service } from './${moduleName}.service';

@Module({
    controllers: [${moduleNameCapitalized}Controller],
    providers: [${moduleNameCapitalized}Service]
})
export class ${moduleNameCapitalized}Module {}`;
    fs.writeFileSync(path.join(modulePath, `${moduleName}.module.ts`), routesContent);

    console.log(`Módulo ${moduleName} gerado com sucesso!`);
}

// Uso: node generate-module.js nome-do-modulo
const moduleName = process.argv[2];
if (!moduleName) {
    console.error('Por favor, forneça o nome do módulo');
    process.exit(1);
}

generateModule(moduleName);
