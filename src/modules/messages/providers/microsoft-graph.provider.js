const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { logger } = require('../../../middlewares/logger');

class MicrosoftGraphProvider {
    constructor() {
        this.clientId = process.env.MICROSOFT_CLIENT_ID;
        this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
        this.tenantId = process.env.MICROSOFT_TENANT_ID;
        this.fromEmail = process.env.MICROSOFT_EMAIL_FROM;

        if (!this.clientId || !this.clientSecret || !this.tenantId || !this.fromEmail) {
            throw new Error('Configurações do Microsoft Graph incompletas');
        }

        this.initializeClient();
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
                        const response = await credential.getToken('https://graph.microsoft.com/.default');
                        return response.token;
                    }
                }
            });

            logger.info('Microsoft Graph client inicializado');
        } catch (error) {
            logger.error('Erro ao inicializar Microsoft Graph client', { error: error.message });
            throw error;
        }
    }

    async sendEmail(to, subject, content, metadata = {}) {
        try {
            const message = {
                message: {
                    subject,
                    body: {
                        contentType: 'HTML',
                        content
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: to
                            }
                        }
                    ]
                },
                saveToSentItems: true
            };

            await this.client.api('/users/' + this.fromEmail + '/sendMail')
                .post(message);

            logger.info('Email enviado com sucesso', { 
                to, 
                subject,
                metadata 
            });

            return true;
        } catch (error) {
            logger.error('Erro ao enviar email', { 
                error: error.message, 
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
