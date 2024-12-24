const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { logger } = require('../../../middlewares/logger');

class MicrosoftGraphProvider {
    constructor() {
        try {
            this.clientId = process.env.MICROSOFT_CLIENT_ID;
            this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
            this.tenantId = process.env.MICROSOFT_TENANT_ID;
            this.userEmail = process.env.MICROSOFT_EMAIL_USER;
            this.fromEmail = process.env.MICROSOFT_EMAIL_FROM;
            this.fromName = process.env.MICROSOFT_EMAIL_FROM_NAME || 'Agile Gestão - Financeiro';

            if (!this.clientId || !this.clientSecret || !this.tenantId || !this.userEmail || !this.fromEmail) {
                throw new Error('Configurações do Microsoft Graph incompletas. Verifique as variáveis de ambiente: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID, MICROSOFT_EMAIL_USER, MICROSOFT_EMAIL_FROM');
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
            this.graphClient = Client.initWithMiddleware({
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
                userEmail: this.userEmail,
                fromEmail: this.fromEmail,
                fromName: this.fromName
            });
        } catch (error) {
            logger.error('Erro ao inicializar Microsoft Graph client', { 
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async sendMail(to, subject, content, metadata = {}) {
        try {
            // Garantir que temos um array de objetos com email
            const recipients = Array.isArray(to) ? to : [{ email: to }];
            
            const mainRecipient = recipients[0].email;
            const ccRecipients = recipients.slice(1).map(r => r.email);

            const requestBody = {
                message: {
                    subject,
                    body: {
                        contentType: 'html',
                        content: content
                    },
                    from: {
                        emailAddress: {
                            address: this.fromEmail,
                            name: this.fromName
                        }
                    },
                    toRecipients: [{
                        emailAddress: {
                            address: mainRecipient
                        }
                    }]
                },
                saveToSentItems: true
            };

            if (ccRecipients.length > 0) {
                requestBody.message.ccRecipients = ccRecipients.map(email => ({
                    emailAddress: {
                        address: email
                    }
                }));
            }

            await this.graphClient.api('/users/' + this.userEmail + '/sendMail')
                .post(requestBody);

            logger.info('Email enviado com sucesso', {
                userEmail: this.userEmail,
                fromEmail: this.fromEmail,
                to: mainRecipient,
                cc: ccRecipients,
                subject,
                metadata
            });
        } catch (error) {
            logger.error('Erro ao enviar email', {
                error: error.message,
                stack: error.stack,
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
