const { Router } = require('express');
const MicrosoftGraphProvider = require('./providers/microsoft-graph.provider');
const { logger } = require('../../middlewares/logger');

module.exports = () => {
    const router = Router();
    const emailProvider = new MicrosoftGraphProvider();

    router.post('/test-email', async (req, res) => {
        try {
            const { to, subject, content } = req.body;

            if (!to || !subject || !content) {
                return res.status(400).json({
                    error: 'Dados inválidos',
                    details: 'Os campos to, subject e content são obrigatórios'
                });
            }

            await emailProvider.sendEmail(
                to,
                subject,
                content,
                { type: 'TEST' }
            );

            return res.json({ 
                success: true,
                message: 'Email enviado com sucesso!',
                details: {
                    to,
                    subject,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Erro ao enviar email', {
                error: error.message,
                stack: error.stack,
                code: error.code,
                statusCode: error.statusCode
            });

            // Mapeia erros específicos para mensagens amigáveis
            if (error.code === 'ErrorAccessDenied') {
                return res.status(403).json({
                    error: 'Acesso negado',
                    details: 'Verifique as permissões do aplicativo no Azure AD'
                });
            }

            if (error.code === 'ErrorInvalidUser') {
                return res.status(400).json({
                    error: 'Usuário inválido',
                    details: 'O email do remetente não é válido no Microsoft 365'
                });
            }

            if (error.code === 'AuthenticationRequiredError') {
                return res.status(401).json({
                    error: 'Erro de autenticação',
                    details: 'Verifique as credenciais do aplicativo (Client ID, Secret e Tenant ID)'
                });
            }

            // Erro genérico
            return res.status(500).json({ 
                error: 'Erro ao enviar email',
                details: error.message,
                requestId: error.requestId || 'unknown'
            });
        }
    });

    return router;
};
