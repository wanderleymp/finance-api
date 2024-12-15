const nodemailer = require('nodemailer');
const { logger } = require('../middlewares/logger');
const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    BASE_URL
} = process.env;

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === '465',
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS
            }
        });
    }

    async sendPasswordResetEmail(email, token) {
        const resetLink = `${BASE_URL}/reset-password?token=${token}`;

        const mailOptions = {
            from: SMTP_FROM,
            to: email,
            subject: 'Recuperação de Senha',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333; text-align: center;">Recuperação de Senha</h1>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                        <p>Você solicitou a recuperação de senha para sua conta.</p>
                        
                        <p>Clique no botão abaixo para criar uma nova senha:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="background-color: #007bff; 
                                      color: white; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 4px;
                                      display: inline-block;">
                                Redefinir Senha
                            </a>
                        </div>
                        
                        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                        <p style="word-break: break-all; color: #666;">
                            ${resetLink}
                        </p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                            <p style="color: #666; font-size: 0.9em;">
                                Este link é válido por 1 hora.
                                Se você não solicitou esta alteração, ignore este email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            logger.info('Email de recuperação de senha enviado com sucesso', { email });
        } catch (error) {
            logger.error('Erro ao enviar email de recuperação de senha', {
                error: error.message,
                stack: error.stack,
                email
            });
            throw new Error('Erro ao enviar email de recuperação de senha');
        }
    }
}

module.exports = new EmailService();
