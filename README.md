# Agile Finance Backend

## Configuração do Ambiente

### Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Preencha as variáveis de ambiente com suas credenciais reais

```bash
cp .env.example .env
```

#### Variáveis Necessárias

- `N8N_BOLETO_CANCEL_WEBHOOK_URL`: URL do webhook para cancelamento de boletos
- `N8N_WEBHOOK_API_KEY`: Chave de API para autenticação
- `N8N_WEBHOOK_API_SECRET`: Segredo da API para autenticação

**IMPORTANTE**: Nunca commite suas credenciais reais. O `.env` já está no `.gitignore`.
