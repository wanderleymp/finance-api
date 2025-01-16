# Configuração de Ambiente na Finance API

## Visão Geral

O sistema de configuração de ambiente da Finance API foi projetado para ser robusto, seguro e flexível. Ele fornece um mecanismo centralizado para carregar e validar variáveis de ambiente.

## Características Principais

- Carregamento de múltiplos arquivos `.env`
- Validação de variáveis críticas
- Suporte a ambientes diferentes (desenvolvimento, produção, teste)
- Valores padrão para configurações
- Validadores personalizados

## Ordem de Carregamento dos Arquivos `.env`

Os arquivos são carregados na seguinte ordem de prioridade:

1. `.env` (Principal)
2. `.env.local` (Configurações locais)
3. `.env.{NODE_ENV}` (Específico do ambiente)
4. `.env.example` (Exemplo, baixa prioridade)

## Variáveis de Ambiente Obrigatórias

### Variáveis Críticas

- `SYSTEM_DATABASE_URL`: URL de conexão com o banco de dados principal
- `JWT_SECRET`: Chave secreta para assinatura de tokens JWT
- `PORT`: Porta em que o servidor irá rodar

### Variáveis Opcionais

- `NODE_ENV`: Ambiente de execução (padrão: `development`)
- `LOG_LEVEL`: Nível de log (padrão: `info`)
- `DATABASE_URL`: URL de conexão alternativa

## Validações Implementadas

### Porta (`PORT`)
- Deve ser um número inteiro
- Entre 1 e 65535

### URL do Banco de Dados (`SYSTEM_DATABASE_URL`)
- Formato de URL PostgreSQL válido
- Deve conter: protocolo, usuário, senha, host, porta e nome do banco

### Segredo JWT (`JWT_SECRET`)
- Comprimento mínimo de 16 caracteres

## Comportamento por Ambiente

### Desenvolvimento
- Logs detalhados de carregamento
- Erros de validação são exibidos, mas não impedem a inicialização

### Produção
- Erros de validação impedem a inicialização do aplicativo
- Logs mais sucintos

## Exemplo de Configuração

```env
# Arquivo .env principal

# Configurações do Banco de Dados
SYSTEM_DATABASE_URL=postgresql://usuario:senha@localhost:5432/finance_db

# Configurações de Segurança
JWT_SECRET=sua_chave_secreta_muito_longa_e_complexa
JWT_EXPIRATION=4h

# Configurações do Servidor
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

## Uso no Código

```javascript
const { env } = require('./src/config/env');

// Acessar variáveis de ambiente
const databaseUrl = env.SYSTEM_DATABASE_URL;
const port = env.PORT;
```

## Boas Práticas

1. Nunca commitar arquivos `.env` com credenciais reais
2. Usar `.env.example` como template
3. Manter segredos seguros e não os expor
4. Usar variáveis de ambiente para configurações sensíveis

## Solução de Problemas

- Verifique se todas as variáveis obrigatórias estão definidas
- Confirme o formato das URLs e segredos
- Consulte os logs para detalhes de erros de configuração

## Extensibilidade

O módulo de configuração pode ser facilmente estendido para adicionar:
- Novos validadores
- Mais variáveis padrão
- Lógica de carregamento personalizada

## Segurança

- Validações impedem configurações incorretas
- Diferenciação de comportamento entre ambientes
- Não expõe informações sensíveis em logs de produção

## Contribuindo

Para adicionar novas validações ou melhorar o sistema de configuração, consulte o arquivo `src/config/env.js`.
