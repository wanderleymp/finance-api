const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { logger } = require('../../../middlewares/logger');

class MicrosoftGraphProvider {
    constructor() {
        try {
            this.clientId = process.env.MICROSOFT_CLIENT_ID;
            this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
            this.tenantId = process.env.MICROSOFT_TENANT_ID;
            this.fromEmail = process.env.MICROSOFT_EMAIL_FROM;

            if (!this.clientId || !this.clientSecret || !this.tenantId || !this.fromEmail) {
                throw new Error('Configurações do Microsoft Graph incompletas. Verifique as variáveis de ambiente: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_EMAIL_FROM');
            }

            this.initializeClient();
        } catch (error) {
            logger.error('Erro ao inicializar MicrosoftGraphProvider', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    initializeClient() {
        try {
            // Criar credencial
            const credential = new ClientSecretCredential(
                this.tenantId,
                this.clientId,
                this.clientSecret
            );

            // Inicializar cliente do Graph
            this.client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: async () => {
                        try {
                            const response = await credential.getToken('https://graph.microsoft.com/.default');
                            return response.token;
                        } catch (error) {
                            logger.error('Erro ao obter token de acesso', {
                                error: error.message,
                                stack: error.stack
                            });
                            throw error;
                        }
                    }
                }
            });

            logger.info('Microsoft Graph client inicializado com sucesso', {
                fromEmail: this.fromEmail
            });
        } catch (error) {
            logger.error('Erro ao inicializar Microsoft Graph client', { 
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async sendEmail(to, subject, content, metadata = {}) {
        try {
            // Validações básicas
            if (!to) throw new Error('O campo "to" é obrigatório');
            if (!subject) throw new Error('O campo "subject" é obrigatório');
            if (!content) throw new Error('O campo "content" é obrigatório');

            const message = {
                message: {
                    subject,
                    body: {
                        contentType: 'HTML',
                        content: this.formatHtmlContent(content)
                    },
                    toRecipients: [{
                        emailAddress: {
                            address: to
                        }
                    }],
                    from: {
                        emailAddress: {
                            address: this.fromEmail
                        }
                    }
                },
                saveToSentItems: true
            };

            await this.client.api(`/users/${this.fromEmail}/sendMail`)
                .post(message);

            logger.info('Email enviado com sucesso', { 
                to, 
                subject,
                metadata,
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            logger.error('Erro ao enviar email', { 
                error: error.message, 
                stack: error.stack,
                code: error.code,
                statusCode: error.statusCode,
                to, 
                subject,
                metadata 
            });
            throw error;
        }
    }

    // Método helper para formatar HTML
    formatHtmlContent(textContent) {
        return `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                ${textContent.replace(/\n/g, '<br>')}
            </div>
        `;
    }
}

module.exports = MicrosoftGraphProvider;
