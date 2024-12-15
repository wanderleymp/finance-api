const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { db } = require('../config/database');
const { logger } = require('../middlewares/logger');
const { ValidationError } = require('../utils/errors');
const emailService = require('./emailService');
const { SALT_ROUNDS, PASSWORD_RESET_EXPIRATION } = process.env;

class PasswordService {
    async sendPasswordResetEmail(email) {
        const user = await db.oneOrNone(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );

        if (!user) {
            // Não revelamos se o email existe ou não por segurança
            logger.info('Tentativa de reset de senha para email não cadastrado', { email });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Token válido por 1 hora

        await db.tx(async t => {
            // Invalida tokens anteriores
            await t.none(
                'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
                [user.id]
            );

            // Cria novo token
            await t.none(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                [user.id, token, expiresAt]
            );
        });

        // Envia email com link de reset
        await emailService.sendPasswordResetEmail(email, token);

        logger.info('Email de reset de senha enviado com sucesso', { userId: user.id });
    }

    async resetPassword(token, newPassword) {
        const resetToken = await db.oneOrNone(
            `SELECT rt.*, u.id as user_id 
             FROM password_reset_tokens rt 
             JOIN users u ON u.id = rt.user_id 
             WHERE rt.token = $1 AND rt.used = false AND rt.expires_at > NOW()`,
            [token]
        );

        if (!resetToken) {
            throw new ValidationError('Token inválido ou expirado');
        }

        const hashedPassword = await bcrypt.hash(newPassword, parseInt(SALT_ROUNDS));

        await db.tx(async t => {
            // Verifica histórico de senhas
            const recentPasswords = await t.manyOrNone(
                'SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
                [resetToken.user_id]
            );

            for (const oldPassword of recentPasswords) {
                const isMatch = await bcrypt.compare(newPassword, oldPassword.password_hash);
                if (isMatch) {
                    throw new ValidationError('A nova senha não pode ser igual às últimas 5 senhas utilizadas');
                }
            }

            // Atualiza a senha
            await t.none(
                'UPDATE users SET password = $1, password_changed_at = NOW() WHERE id = $2',
                [hashedPassword, resetToken.user_id]
            );

            // Salva no histórico
            await t.none(
                'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
                [resetToken.user_id, hashedPassword]
            );

            // Marca token como usado
            await t.none(
                'UPDATE password_reset_tokens SET used = true WHERE id = $1',
                [resetToken.id]
            );
        });

        logger.info('Senha resetada com sucesso', { userId: resetToken.user_id });
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await db.one(
            'SELECT id, password FROM users WHERE id = $1',
            [userId]
        );

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new ValidationError('Senha atual incorreta');
        }

        const hashedPassword = await bcrypt.hash(newPassword, parseInt(SALT_ROUNDS));

        await db.tx(async t => {
            // Verifica histórico de senhas
            const recentPasswords = await t.manyOrNone(
                'SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
                [userId]
            );

            for (const oldPassword of recentPasswords) {
                const isMatch = await bcrypt.compare(newPassword, oldPassword.password_hash);
                if (isMatch) {
                    throw new ValidationError('A nova senha não pode ser igual às últimas 5 senhas utilizadas');
                }
            }

            // Atualiza a senha
            await t.none(
                'UPDATE users SET password = $1, password_changed_at = NOW() WHERE id = $2',
                [hashedPassword, userId]
            );

            // Salva no histórico
            await t.none(
                'INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)',
                [userId, hashedPassword]
            );
        });

        logger.info('Senha alterada com sucesso', { userId });
    }

    async checkPasswordExpiration(userId) {
        const user = await db.one(
            'SELECT password_changed_at FROM users WHERE id = $1',
            [userId]
        );

        const expirationDays = parseInt(PASSWORD_RESET_EXPIRATION);
        const expirationDate = new Date(user.password_changed_at);
        expirationDate.setDate(expirationDate.getDate() + expirationDays);

        const now = new Date();
        const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

        return {
            passwordExpired: now > expirationDate,
            daysUntilExpiration: Math.max(0, daysUntilExpiration)
        };
    }
}

module.exports = new PasswordService();
