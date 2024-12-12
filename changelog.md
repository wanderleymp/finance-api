# Changelog

## [Não Lançado]

### Adicionado
- Estrutura inicial do projeto
- Configuração básica do servidor Express
- Configuração do ambiente de desenvolvimento
- Estrutura de pastas para a API RESTful

### Configurações
- Adicionado `.env` para gerenciamento de variáveis de ambiente
- Configurado `.gitignore` para ignorar arquivos sensíveis
- Criado `README.md` com instruções de instalação e uso
## Configuração do Banco de Dados de Logs de Desenvolvimento

- **Banco de Dados:** dev_history
- **Usuário:** dev_user
- **Permissões:** ALL PRIVILEGES
- **Tabela:** development_log
  - Campos: id, task, result, description, hours_spent, created_at
- **Configurações de Conexão:**
  - IP: 10.1.0.2
  - Método de Autenticação: md5

### Próximos Passos
- Implementar autenticação JWT
- Configurar conexão com banco de dados PostgreSQL
- Desenvolver rotas iniciais da API
