# Guia de Criação de Novas Rotas

## Checklist Pré-Requisitos

1. **Verificar Dependências**
   - [ ] Confirmar que todas as dependências necessárias estão no `package.json`
   - [ ] Verificar se o `sequelize` está instalado (necessário para modelos)
   - [ ] Verificar se o `joi` está instalado (necessário para validações)

2. **Estrutura de Arquivos**
   Seguir esta estrutura para cada nova funcionalidade:
   ```
   /modules/[feature-name]/
   ├── services/           # Lógica de negócios
   ├── controllers/        # Controladores
   ├── repositories/       # Acesso a dados
   ├── schemas/           # Schemas de validação
   ├── models/            # Modelos do Sequelize
   ├── [feature].routes.js
   └── [feature].module.js
   ```

## Passo a Passo para Criar Nova Rota

1. **Criar/Verificar Modelo**
   ```javascript
   // Em /models/[model-name].js
   module.exports = (sequelize, DataTypes) => {
     const ModelName = sequelize.define('ModelName', {
       // definir campos
     });
     return ModelName;
   };
   ```

2. **Criar Serviço**
   ```javascript
   // Em /services/[feature].service.js
   const { ModelName } = require('../../../models');
   
   class FeatureService {
     async findAll(filters) {
       return ModelName.findAll({ where: filters });
     }
   }
   ```

3. **Criar Controller**
   ```javascript
   // Em /controllers/[feature].controller.js
   class FeatureController {
     constructor(service) {
       this.service = service;
     }
   
     async findAll(req, res, next) {
       try {
         const result = await this.service.findAll(req.query);
         res.json(result);
       } catch (error) {
         next(error);
       }
     }
   }
   ```

4. **Criar Schema de Validação**
   ```javascript
   // Em /schemas/[feature].schema.js
   const Joi = require('joi');
   
   const FeatureSchema = {
     query: Joi.object({
       // definir validações
     })
   };
   ```

5. **Criar Arquivo de Rotas**
   ```javascript
   // Em [feature].routes.js
   const { Router } = require('express');
   const { authMiddleware } = require('../../middlewares/auth');
   const { validateSchema } = require('../../utils/validateSchema');
   
   class FeatureRoutes {
     constructor() {
       this.router = Router();
       this.service = new FeatureService();
       this.controller = new FeatureController(this.service);
       this.setupRoutes();
     }
   
     setupRoutes() {
       this.router.use(authMiddleware);
       this.router.get('/',
         (req, res, next) => validateSchema(FeatureSchema.query, req.query)
           .then(() => next())
           .catch(next),
         this.controller.findAll.bind(this.controller)
       );
     }
   }
   ```

## Erros Comuns e Soluções

1. **MODULE_NOT_FOUND**
   - Verificar se o pacote está no package.json
   - Rodar `npm install`
   - Verificar o caminho dos imports (usar caminhos relativos corretos)

2. **Sequelize não encontrado**
   ```bash
   npm install --save sequelize
   npm install --save pg pg-hstore  # para PostgreSQL
   ```

3. **Erro de Validação**
   - Verificar se joi está instalado
   ```bash
   npm install --save joi
   ```

4. **Erro de Autenticação**
   - Verificar se o middleware de autenticação está importado corretamente
   - Confirmar que o token está sendo enviado no header

## Boas Práticas

1. **Organização**
   - Manter arquivos relacionados no mesmo módulo
   - Usar nomes consistentes
   - Seguir a estrutura de pastas padrão

2. **Validação**
   - Sempre validar inputs
   - Usar schemas Joi para validação
   - Tratar erros adequadamente

3. **Código**
   - Usar async/await
   - Tratar erros com try/catch
   - Usar injeção de dependência

4. **Testes**
   - Criar testes unitários para serviços
   - Criar testes de integração para rotas
   - Testar casos de erro

## Comandos Úteis

```bash
# Instalar dependências comuns
npm install --save sequelize joi express

# Limpar cache do node
npm cache clean --force

# Verificar dependências instaladas
npm list

# Rodar em modo desenvolvimento
npm run dev
```

## Template Base

Para facilitar, use este template como base para novas funcionalidades:
[Link para o template no repositório]

## Suporte

Em caso de problemas:
1. Verificar logs de erro
2. Confirmar todas as dependências
3. Verificar caminhos dos imports
4. Consultar a documentação
