# Comandos Úteis para Desenvolvimento e Gerenciamento da Aplicação

## Desenvolvimento

### Iniciar Servidor em Modo de Desenvolvimento
```bash
npm run dev
```
- Inicia o servidor usando `ts-node-dev`
- Recarrega automaticamente em mudanças de código
- Ideal para desenvolvimento local

### Compilar Projeto para Produção
```bash
npm run build
```
- Compila TypeScript para JavaScript
- Gera arquivos na pasta `dist`

### Iniciar Servidor de Produção
```bash
npm start
```
- Roda a versão compilada do projeto
- Usa os arquivos gerados em `dist`

## Banco de Dados

### Gerar Migração do Prisma
```bash
npx prisma migrate dev --name descricao_da_mudanca
```
- Cria uma nova migração baseada nas mudanças no schema
- Aplica as mudanças no banco de dados de desenvolvimento

### Atualizar Schema do Prisma
```bash
npx prisma generate
```
- Regenera os tipos do Prisma baseados no schema
- Importante após mudanças no schema

### Visualizar Dados no Banco
```bash
npx prisma studio
```
- Abre uma interface web para visualizar e editar dados do banco

## Testes

### Rodar Testes Unitários
```bash
npm run test:unit
```
- Executa testes unitários usando Jest

### Rodar Testes de Integração
```bash
npm run test:integration
```
- Executa testes de integração

### Cobertura de Testes
```bash
npm run test:coverage
```
- Gera relatório de cobertura de testes

## Docker

### Construir Imagem
```bash
docker build -t finance-api .
```
- Cria uma imagem Docker da aplicação

### Rodar Container
```bash
docker run -p 3000:3000 finance-api
```
- Inicia um container com a aplicação
- Mapeia porta 3000 do container para porta 3000 do host

## Utilitários

### Limpar Dependências
```bash
npm prune
```
- Remove pacotes npm não utilizados

### Atualizar Dependências
```bash
npm update
```
- Atualiza pacotes para as versões mais recentes permitidas

## Lint e Formatação

### Verificar Código
```bash
npm run lint
```
- Verifica problemas de estilo e possíveis erros

### Formatar Código
```bash
npm run format
```
- Corrige automaticamente problemas de formatação

## Variáveis de Ambiente

### Copiar Exemplo de Env
```bash
cp .env.example .env
```
- Cria um arquivo .env a partir do template

## Documentação

### Gerar Documentação Swagger
```bash
npm run swagger
```
- Gera documentação da API
