# Guia de Desenvolvimento - Finance API

## Índice
1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Criando Novos Módulos](#criando-novos-módulos)
3. [Padrões de Código](#padrões-de-código)
4. [Testes](#testes)
5. [Documentação](#documentação)

## Estrutura do Projeto

```
finance-api/
├── src/
│   ├── modules/           # Módulos da aplicação
│   ├── config/           # Configurações
│   ├── middlewares/      # Middlewares Express
│   ├── utils/            # Utilitários
│   ├── app.js           # Configuração do Express
│   └── server.js        # Entrada da aplicação
├── scripts/             # Scripts de utilidade
└── docs/               # Documentação
```

## Criando Novos Módulos

### Usando o Script de Geração

```bash
node scripts/create-module.js NomeDoModulo
```

Exemplo:
```bash
node scripts/create-module.js Product
```

### Estrutura Gerada
```
modules/product/
├── interfaces/
│   ├── IProductService.js
│   └── IProductRepository.js
├── dto/
│   ├── create-product.dto.js
│   ├── update-product.dto.js
│   └── product-response.dto.js
├── validators/
│   └── product.validator.js
├── schemas/
│   └── product.schema.js
├── __tests__/
│   └── product.unit.test.js
├── product.controller.js
├── product.service.js
├── product.repository.js
├── product.routes.js
└── product.module.js
```

### Checklist Pós-Criação

1. **Database**
   - [ ] Criar migration para a tabela
   - [ ] Definir índices necessários
   - [ ] Adicionar constraints de FK se necessário

2. **Interfaces**
   - [ ] Definir métodos em IService
   - [ ] Definir métodos em IRepository
   - [ ] Documentar parâmetros e retornos

3. **DTOs**
   - [ ] Implementar CreateDTO
   - [ ] Implementar UpdateDTO
   - [ ] Implementar ResponseDTO
   - [ ] Adicionar validações

4. **Validação**
   - [ ] Definir schemas Joi
   - [ ] Adicionar regras de negócio
   - [ ] Validar tipos de dados

5. **Repository**
   - [ ] Implementar queries SQL
   - [ ] Adicionar índices necessários
   - [ ] Implementar tratamento de erros
   - [ ] Documentar queries complexas

6. **Service**
   - [ ] Implementar lógica de negócio
   - [ ] Adicionar validações
   - [ ] Implementar cache se necessário
   - [ ] Documentar regras complexas

7. **Controller**
   - [ ] Implementar endpoints
   - [ ] Adicionar tratamento de erros
   - [ ] Documentar respostas
   - [ ] Validar permissões

8. **Testes**
   - [ ] Criar testes unitários
   - [ ] Criar testes de integração
   - [ ] Testar casos de erro
   - [ ] Testar validações

9. **Documentação**
   - [ ] Documentar API (Swagger)
   - [ ] Atualizar README se necessário
   - [ ] Documentar regras de negócio
   - [ ] Adicionar exemplos de uso

10. **Segurança**
    - [ ] Validar permissões
    - [ ] Sanitizar inputs
    - [ ] Validar rate limiting
    - [ ] Verificar SQL injection

11. **Performance**
    - [ ] Implementar cache
    - [ ] Otimizar queries
    - [ ] Adicionar índices
    - [ ] Paginar resultados

## Padrões de Código

### Nomenclatura
- **Arquivos**: kebab-case (exemplo: `user-profile.service.js`)
- **Classes**: PascalCase (exemplo: `UserProfileService`)
- **Métodos**: camelCase (exemplo: `findByEmail`)
- **Variáveis**: camelCase (exemplo: `userEmail`)
- **Constantes**: SNAKE_CASE (exemplo: `MAX_LOGIN_ATTEMPTS`)

### Estrutura de Arquivos
- Um arquivo por classe/componente
- Importações organizadas por tipo
- Exports no final do arquivo
- Documentação JSDoc para funções públicas

### Tratamento de Erros
- Usar classes de erro customizadas
- Logar erros com contexto
- Retornar mensagens amigáveis ao usuário
- Manter stack trace em desenvolvimento

### Async/Await
- Usar try/catch em operações assíncronas
- Evitar callbacks aninhados
- Usar Promise.all para operações paralelas
- Tratar timeouts adequadamente

## Testes

### Unitários
- Um arquivo de teste por componente
- Usar mocks para dependências
- Testar casos de sucesso e erro
- Manter cobertura acima de 80%

### Integração
- Testar fluxos completos
- Usar banco de dados de teste
- Limpar dados entre testes
- Testar endpoints com dados reais

## Documentação

### API
- Usar Swagger/OpenAPI
- Documentar todos os endpoints
- Incluir exemplos de request/response
- Documentar códigos de erro

### Código
- Usar JSDoc para funções públicas
- Documentar regras de negócio complexas
- Manter README atualizado
- Documentar configurações necessárias
