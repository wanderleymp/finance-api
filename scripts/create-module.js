#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Templates para cada tipo de arquivo
const templates = {
    interface: (moduleName, type) => `
interface I${moduleName}${type} {
    // TODO: Definir interface
}

module.exports = I${moduleName}${type};
`.trim(),

    dto: (moduleName, type) => `
class ${moduleName}${type}DTO {
    constructor(data) {
        // TODO: Implementar DTO
    }
}

module.exports = ${moduleName}${type}DTO;
`.trim(),

    validator: (moduleName) => `
const Joi = require('joi');

class ${moduleName}Validator {
    static validate${moduleName}(data) {
        const schema = Joi.object({
            // TODO: Definir schema de validação
        });

        return schema.validate(data);
    }
}

module.exports = ${moduleName}Validator;
`.trim(),

    schema: (moduleName) => `
const Joi = require('joi');

const ${moduleName.toLowerCase()}Schema = {
    // TODO: Definir schema
};

module.exports = ${moduleName.toLowerCase()}Schema;
`.trim(),

    test: (moduleName) => `
const ${moduleName}Service = require('../${moduleName.toLowerCase()}.service');
const ${moduleName}Repository = require('../${moduleName.toLowerCase()}.repository');

describe('${moduleName}Service', () => {
    let service;
    let repository;

    beforeEach(() => {
        repository = new ${moduleName}Repository();
        service = new ${moduleName}Service(repository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // TODO: Adicionar testes
});
`.trim(),

    controller: (moduleName) => `
const { logger } = require('../../middlewares/logger');
const ${moduleName}Service = require('./${moduleName.toLowerCase()}.service');

class ${moduleName}Controller {
    constructor() {
        this.service = new ${moduleName}Service();
    }

    async create(req, res) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao criar ${moduleName.toLowerCase()}', { error });
            res.status(500).json({ error: error.message });
        }
    }

    async findAll(req, res) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao listar ${moduleName.toLowerCase()}', { error });
            res.status(500).json({ error: error.message });
        }
    }

    async findById(req, res) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao buscar ${moduleName.toLowerCase()}', { error });
            res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao atualizar ${moduleName.toLowerCase()}', { error });
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao deletar ${moduleName.toLowerCase()}', { error });
            res.status(500).json({ error: error.message });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await this.service.refreshToken(refreshToken);
            res.json(result);
        } catch (error) {
            logger.error('Erro ao atualizar token de acesso', { error });
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ${moduleName}Controller();
`.trim(),

    service: (moduleName) => `
const { logger } = require('../../middlewares/logger');
const ${moduleName}Repository = require('./${moduleName.toLowerCase()}.repository');
const I${moduleName}Service = require('./interfaces/I${moduleName}Service');
const jwt = require('jsonwebtoken');
const redis = require('../../config/redis');

class ${moduleName}Service extends I${moduleName}Service {
    constructor(repository = new ${moduleName}Repository()) {
        super();
        this.repository = repository;
    }

    async create(data) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao criar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async findAll(filters = {}) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao listar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao buscar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao atualizar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async delete(id) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao deletar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            // Verificar refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            // Verificar se o refresh token está na blacklist
            const isBlacklisted = await redis.client.get(\`refresh_token:\${decoded.userId}\`);
            if (isBlacklisted) {
                throw new Error('Refresh token revogado');
            }

            // Gerar novos tokens
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            const newRefreshToken = jwt.sign(
                { userId: decoded.userId },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
            );

            // Atualizar refresh token no Redis
            await redis.client.setex(
                \`refresh_token:\${decoded.userId}\`,
                parseInt(process.env.REFRESH_TOKEN_EXPIRATION) * 24 * 60 * 60,
                newRefreshToken
            );

            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: process.env.JWT_EXPIRATION
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ${moduleName}Service;
`.trim(),

    repository: (moduleName) => `
const { logger } = require('../../middlewares/logger');
const I${moduleName}Repository = require('./interfaces/I${moduleName}Repository');
const { systemDatabase } = require('../../config/database');

class ${moduleName}Repository extends I${moduleName}Repository {
    constructor(db = systemDatabase) {
        super();
        this.db = db;
        this.table = '${moduleName.toLowerCase()}s';
    }

    async create(data) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao criar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async findAll(filters = {}) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao listar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async findById(id) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao buscar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async update(id, data) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao atualizar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }

    async delete(id) {
        try {
            // TODO: Implementar
        } catch (error) {
            logger.error('Erro ao deletar ${moduleName.toLowerCase()}', { error });
            throw error;
        }
    }
}

module.exports = ${moduleName}Repository;
`.trim(),

    routes: (moduleName) => `
const express = require('express');
const ${moduleName}Controller = require('./${moduleName.toLowerCase()}.controller');
const { authMiddleware } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/requestValidator');
const ${moduleName.toLowerCase()}Schema = require('./schemas/${moduleName.toLowerCase()}.schema');

const router = express.Router();

router.use(authMiddleware);

router.post('/',
    validate('body', ${moduleName.toLowerCase()}Schema.create),
    ${moduleName}Controller.create
);

router.get('/',
    validate('query', ${moduleName.toLowerCase()}Schema.findAll),
    ${moduleName}Controller.findAll
);

router.get('/:id',
    validate('params', ${moduleName.toLowerCase()}Schema.findById),
    ${moduleName}Controller.findById
);

router.put('/:id',
    validate('params', ${moduleName.toLowerCase()}Schema.findById),
    validate('body', ${moduleName.toLowerCase()}Schema.update),
    ${moduleName}Controller.update
);

router.delete('/:id',
    validate('params', ${moduleName.toLowerCase()}Schema.findById),
    ${moduleName}Controller.delete
);

router.post('/refresh',
    validate('body', ${moduleName.toLowerCase()}Schema.refresh),
    ${moduleName}Controller.refreshToken
);

module.exports = router;
`.trim(),

    module: (moduleName) => `
const ${moduleName}Routes = require('./${moduleName.toLowerCase()}.routes');

module.exports = {
    routes: ${moduleName}Routes
};
`.trim(),

    swagger: (moduleName) => `
openapi: 3.0.0
tags:
  - name: ${moduleName}
    description: Operações relacionadas a ${moduleName}

paths:
  /${moduleName.toLowerCase()}s:
    get:
      tags:
        - ${moduleName}
      summary: Lista todos os ${moduleName.toLowerCase()}s
      description: Retorna uma lista paginada de ${moduleName.toLowerCase()}s
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
          description: Número da página
        - in: query
          name: limit
          schema:
            type: integer
            default: 10
          description: Itens por página
      responses:
        '200':
          description: Lista de ${moduleName.toLowerCase()}s
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/${moduleName}'
                  pagination:
                    type: object
                    properties:
                      total: 
                        type: integer
                      page:
                        type: integer
                      limit:
                        type: integer
        '401':
          description: Não autorizado
        '500':
          description: Erro interno do servidor
    
    post:
      tags:
        - ${moduleName}
      summary: Cria um novo ${moduleName.toLowerCase()}
      description: Cria um novo ${moduleName.toLowerCase()} com os dados fornecidos
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Create${moduleName}'
      responses:
        '201':
          description: ${moduleName} criado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${moduleName}'
        '400':
          description: Dados inválidos
        '401':
          description: Não autorizado
        '500':
          description: Erro interno do servidor

  /${moduleName.toLowerCase()}s/{id}:
    get:
      tags:
        - ${moduleName}
      summary: Busca um ${moduleName.toLowerCase()} por ID
      description: Retorna um único ${moduleName.toLowerCase()} pelo ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do ${moduleName.toLowerCase()}
      responses:
        '200':
          description: ${moduleName} encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${moduleName}'
        '404':
          description: ${moduleName} não encontrado
        '401':
          description: Não autorizado
        '500':
          description: Erro interno do servidor

    put:
      tags:
        - ${moduleName}
      summary: Atualiza um ${moduleName.toLowerCase()}
      description: Atualiza um ${moduleName.toLowerCase()} existente pelo ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do ${moduleName.toLowerCase()}
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Update${moduleName}'
      responses:
        '200':
          description: ${moduleName} atualizado com sucesso
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${moduleName}'
        '400':
          description: Dados inválidos
        '404':
          description: ${moduleName} não encontrado
        '401':
          description: Não autorizado
        '500':
          description: Erro interno do servidor

    delete:
      tags:
        - ${moduleName}
      summary: Remove um ${moduleName.toLowerCase()}
      description: Remove um ${moduleName.toLowerCase()} existente pelo ID
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: integer
          description: ID do ${moduleName.toLowerCase()}
      responses:
        '204':
          description: ${moduleName} removido com sucesso
        '404':
          description: ${moduleName} não encontrado
        '401':
          description: Não autorizado
        '500':
          description: Erro interno do servidor

  /${moduleName.toLowerCase()}s/refresh:
    post:
      tags:
        - ${moduleName}
      summary: Atualiza o token de acesso
      description: Gera um novo token de acesso usando o refresh token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                refreshToken:
                  type: string
                  description: Refresh token válido
              required:
                - refreshToken
      responses:
        '200':
          description: Novo token gerado com sucesso
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                    description: Novo token de acesso
                  refreshToken:
                    type: string
                    description: Novo refresh token
                  expiresIn:
                    type: integer
                    description: Tempo de expiração em segundos
        '401':
          description: Refresh token inválido ou expirado
        '500':
          description: Erro interno do servidor

components:
  schemas:
    ${moduleName}:
      type: object
      properties:
        id:
          type: integer
          description: ID único do ${moduleName.toLowerCase()}
        # TODO: Adicionar outras propriedades
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Create${moduleName}:
      type: object
      properties:
        # TODO: Adicionar propriedades necessárias para criação
      required:
        # TODO: Adicionar campos obrigatórios

    Update${moduleName}:
      type: object
      properties:
        # TODO: Adicionar propriedades que podem ser atualizadas
`.trim()
};

async function createDirectory(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

async function createFile(filePath, content) {
    try {
        await fs.writeFile(filePath, content);
        console.log(`✅ Created ${filePath}`);
    } catch (error) {
        console.error(`❌ Error creating ${filePath}:`, error);
        throw error;
    }
}

async function updateAppJs(moduleName) {
    const appPath = path.join(process.cwd(), 'src', 'app.js');
    try {
        let content = await fs.readFile(appPath, 'utf8');
        
        // Encontrar onde as importações de rotas terminam
        const lastImportIndex = content.lastIndexOf('const') < content.lastIndexOf('require') 
            ? content.lastIndexOf('require')
            : content.lastIndexOf('const');
        
        // Adicionar nova importação após a última
        const importStatement = `\nconst ${moduleName.toLowerCase()}Routes = require('./modules/${moduleName.toLowerCase()}/${moduleName.toLowerCase()}.module').routes;`;
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);

        // Encontrar onde as rotas são registradas
        const routesIndex = content.indexOf('app.use(');
        if (routesIndex === -1) throw new Error('Não foi possível encontrar onde registrar a rota');

        // Adicionar nova rota após a última
        const routeStatement = `\napp.use('/${moduleName.toLowerCase()}s', ${moduleName.toLowerCase()}Routes);`;
        const lastRouteIndex = content.lastIndexOf('app.use(');
        content = content.slice(0, lastRouteIndex) + routeStatement + content.slice(lastRouteIndex);

        // Salvar arquivo
        await fs.writeFile(appPath, content);
        console.log(`✅ Updated ${appPath} with new routes`);
    } catch (error) {
        console.error(`❌ Error updating ${appPath}:`, error);
        console.log('⚠️ Please add the following lines manually to src/app.js:');
        console.log(`const ${moduleName.toLowerCase()}Routes = require('./modules/${moduleName.toLowerCase()}/${moduleName.toLowerCase()}.module').routes;`);
        console.log(`app.use('/${moduleName.toLowerCase()}s', ${moduleName.toLowerCase()}Routes);`);
    }
}

async function createModule(moduleName) {
    const baseDir = path.join(process.cwd(), 'src', 'modules', moduleName.toLowerCase());

    // Criar diretórios
    const directories = [
        baseDir,
        path.join(baseDir, 'interfaces'),
        path.join(baseDir, 'dto'),
        path.join(baseDir, 'validators'),
        path.join(baseDir, 'schemas'),
        path.join(baseDir, '__tests__'),
        path.join(baseDir, 'docs')  // Novo diretório para documentação
    ];

    for (const dir of directories) {
        await createDirectory(dir);
    }

    // Criar arquivos
    const files = [
        { path: path.join(baseDir, 'interfaces', `I${moduleName}Service.js`), content: templates.interface(moduleName, 'Service') },
        { path: path.join(baseDir, 'interfaces', `I${moduleName}Repository.js`), content: templates.interface(moduleName, 'Repository') },
        { path: path.join(baseDir, 'dto', `create-${moduleName.toLowerCase()}.dto.js`), content: templates.dto(moduleName, 'Create') },
        { path: path.join(baseDir, 'dto', `update-${moduleName.toLowerCase()}.dto.js`), content: templates.dto(moduleName, 'Update') },
        { path: path.join(baseDir, 'dto', `${moduleName.toLowerCase()}-response.dto.js`), content: templates.dto(moduleName, 'Response') },
        { path: path.join(baseDir, 'validators', `${moduleName.toLowerCase()}.validator.js`), content: templates.validator(moduleName) },
        { path: path.join(baseDir, 'schemas', `${moduleName.toLowerCase()}.schema.js`), content: templates.schema(moduleName) },
        { path: path.join(baseDir, '__tests__', `${moduleName.toLowerCase()}.unit.test.js`), content: templates.test(moduleName) },
        { path: path.join(baseDir, `${moduleName.toLowerCase()}.controller.js`), content: templates.controller(moduleName) },
        { path: path.join(baseDir, `${moduleName.toLowerCase()}.service.js`), content: templates.service(moduleName) },
        { path: path.join(baseDir, `${moduleName.toLowerCase()}.repository.js`), content: templates.repository(moduleName) },
        { path: path.join(baseDir, `${moduleName.toLowerCase()}.routes.js`), content: templates.routes(moduleName) },
        { path: path.join(baseDir, `${moduleName.toLowerCase()}.module.js`), content: templates.module(moduleName) },
        { path: path.join(baseDir, 'docs', 'swagger.yaml'), content: templates.swagger(moduleName) }
    ];

    for (const file of files) {
        await createFile(file.path, file.content);
    }

    // Atualizar app.js com as novas rotas
    await updateAppJs(moduleName);

    // Formatar arquivos com Prettier
    try {
        execSync(`npx prettier --write "${baseDir}/**/*.js"`);
        console.log('✨ Formatted all files with Prettier');
    } catch (error) {
        console.warn('⚠️ Warning: Could not format files with Prettier:', error.message);
    }

    console.log(`
🎉 Module ${moduleName} created successfully!

Next steps:
1. Implement the TODOs in each file
2. Create database migrations if needed
3. Add tests
4. Update documentation
`);
}

// Pegar nome do módulo da linha de comando
const moduleName = process.argv[2];

if (!moduleName) {
    console.error('❌ Please provide a module name');
    process.exit(1);
}

// Converter primeira letra para maiúscula
const formattedModuleName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

createModule(formattedModuleName).catch(error => {
    console.error('❌ Error creating module:', error);
    process.exit(1);
});
