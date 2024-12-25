# Guia de Implementação - Microsoft Graph Webhook

Este documento descreve a implementação do webhook do Microsoft Graph para monitoramento de e-mails, incluindo os passos necessários para configuração em ambientes de desenvolvimento e produção.

## Índice
1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Implementação](#implementação)
5. [Migração para Produção](#migração-para-produção)
6. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
7. [Troubleshooting](#troubleshooting)

## Visão Geral

O webhook do Microsoft Graph é utilizado para receber notificações em tempo real quando e-mails são recebidos ou atualizados. A implementação inclui:
- Endpoint de validação para o Microsoft Graph
- Processamento de notificações de e-mail
- Criptografia de dados usando certificados
- Autenticação e autorização
- Renovação automática de subscrições

## Pré-requisitos

1. **Microsoft Azure**
   - Conta Azure ativa
   - Aplicativo registrado no Azure AD
   - Permissões configuradas:
     - `Mail.Read`
     - `Mail.ReadWrite`
     - `User.Read`

2. **Certificados**
   - Certificado SSL válido para o domínio
   - Certificado para criptografia de dados do webhook

3. **Variáveis de Ambiente**
   ```env
   MICROSOFT_CLIENT_ID=seu_client_id
   MICROSOFT_CLIENT_SECRET=seu_client_secret
   MICROSOFT_TENANT_ID=seu_tenant_id
   MICROSOFT_EMAIL_USER=email_do_usuario
   GRAPH_WEBHOOK_BASE_URL=https://seu.dominio.com
   GRAPH_WEBHOOK_PATH=/webhooks/graph/messages
   GRAPH_WEBHOOK_SECRET=seu_webhook_secret
   GRAPH_WEBHOOK_CERTIFICATE=seu_certificado_base64
   GRAPH_WEBHOOK_CERTIFICATE_ID=id_do_certificado
   ```

## Configuração do Ambiente

1. **Geração de Certificados**
   ```bash
   # Gerar certificado para o webhook
   openssl req -x509 -newkey rsa:4096 -keyout webhook.key -out webhook.crt -days 365 -nodes -subj "/CN=seu.dominio.com"
   
   # Converter para Base64
   cat webhook.crt | base64 -w 0 > webhook.b64
   ```

2. **Configuração do Azure AD**
   - Registrar novo aplicativo
   - Adicionar URLs de redirecionamento
   - Configurar permissões
   - Gerar secret do cliente

3. **Configuração do Servidor**
   - Instalar dependências:
     ```bash
     npm install @microsoft/microsoft-graph-client @azure/identity
     ```
   - Configurar CORS para o domínio do Microsoft Graph
   - Configurar certificado SSL

## Implementação

1. **Estrutura de Arquivos**
   ```
   src/
   ├── modules/
   │   └── messages/
   │       ├── routes/
   │       │   └── webhook.routes.js
   │       └── services/
   │           └── graph-webhook.service.js
   ├── middlewares/
   │   └── auth.js
   └── app.js
   ```

2. **Endpoints**
   - `GET /webhooks/graph/messages` - Validação do webhook
   - `POST /webhooks/graph/messages` - Recebimento de notificações
   - `POST /webhooks/graph/subscribe` - Criação de subscription
   - `POST /webhooks/graph/renew/:subscriptionId` - Renovação de subscription
   - `DELETE /webhooks/graph/subscription/:subscriptionId` - Remoção de subscription

3. **Validação de Segurança**
   - Verificação de clientState
   - Validação de certificados
   - Autenticação JWT

## Migração para Produção

1. **Preparação**
   - Gerar novos certificados para produção
   - Configurar DNS e SSL
   - Atualizar variáveis de ambiente

2. **Checklist de Migração**
   ```
   [ ] Backup dos certificados de desenvolvimento
   [ ] Geração de novos certificados
   [ ] Atualização do DNS
   [ ] Configuração do SSL
   [ ] Atualização das variáveis de ambiente
   [ ] Teste de validação do webhook
   [ ] Teste de notificações
   [ ] Configuração de monitoramento
   ```

3. **Configurações de Produção**
   ```env
   # Exemplo de configuração para produção
   GRAPH_WEBHOOK_BASE_URL=https://api.agilefinance.com.br
   NODE_ENV=production
   ```

4. **Atualizações Necessárias**
   - Atualizar URLs no Azure AD
   - Configurar certificados de produção
   - Atualizar regras de firewall
   - Configurar load balancer (se necessário)

## Monitoramento e Manutenção

1. **Logs**
   - Monitorar logs de validação
   - Verificar logs de notificações
   - Acompanhar renovação de subscriptions

2. **Alertas**
   - Configurar alertas para:
     - Falhas de validação
     - Erros de notificação
     - Expiração de certificados
     - Expiração de subscriptions

3. **Backup**
   - Manter backup dos certificados
   - Documentar procedimentos de recuperação
   - Testar processo de restore

## Troubleshooting

1. **Problemas Comuns**
   - Erro de validação do webhook
     ```
     Verificar:
     - URL de notificação
     - Certificado SSL
     - Headers de resposta
     ```
   
   - Falha na criação de subscription
     ```
     Verificar:
     - Permissões no Azure AD
     - Formato do certificado
     - Validação do endpoint
     ```

   - Notificações não recebidas
     ```
     Verificar:
     - Firewall e DNS
     - Logs do servidor
     - Status da subscription
     ```

2. **Comandos Úteis**
   ```bash
   # Testar endpoint de validação
   curl -X GET "https://seu.dominio.com/webhooks/graph/messages?validationToken=test"

   # Criar subscription
   curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"changeType":"created,updated","notificationUrl":"https://seu.dominio.com/webhooks/graph/messages"}' \
     "https://seu.dominio.com/webhooks/graph/subscribe"
   ```

3. **Contatos de Suporte**
   - Suporte Microsoft Graph: [Graph Support](https://developer.microsoft.com/graph/support)
   - Documentação: [Graph Webhooks](https://docs.microsoft.com/graph/webhooks)
   - Azure Support: [Azure Portal](https://portal.azure.com)
