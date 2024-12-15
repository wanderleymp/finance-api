const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { logger } = require('../logger');

class TwoFactorAuth {
    static generateSecret(username) {
        return speakeasy.generateSecret({
            name: `Finance API (${username})`
        });
    }

    static async generateQRCode(secret) {
        try {
            return await QRCode.toDataURL(secret.otpauth_url);
        } catch (error) {
            logger.error('Erro ao gerar QR Code', { error });
            throw new Error('Erro ao gerar QR Code para 2FA');
        }
    }

    static verifyToken(secret, token) {
        try {
            return speakeasy.totp.verify({
                secret: secret.base32,
                encoding: 'base32',
                token: token,
                window: 1
            });
        } catch (error) {
            logger.error('Erro ao verificar token 2FA', { error });
            return false;
        }
    }
}

module.exports = TwoFactorAuth;
