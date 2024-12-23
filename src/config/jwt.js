const jwt = require('jsonwebtoken');
const { logger } = require('../middlewares/logger');

// Valores padrão para desenvolvimento
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'sua_chave_refresh_secreta_aqui',
  expiration: process.env.JWT_EXPIRATION || '1h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
};

class JwtService {
  static get config() {
    return JWT_CONFIG;
  }

  static generateToken(payload) {
    try {
      return jwt.sign(
        payload, 
        JWT_CONFIG.secret, 
        { expiresIn: JWT_CONFIG.expiration }
      );
    } catch (error) {
      logger.error('Error generating token', { error: error.message });
      throw error;
    }
  }

  static generateRefreshToken(payload) {
    try {
      return jwt.sign(
        payload,
        JWT_CONFIG.refreshSecret,
        { expiresIn: JWT_CONFIG.refreshExpiration }
      );
    } catch (error) {
      logger.error('Error generating refresh token', { error: error.message });
      throw error;
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_CONFIG.secret);
    } catch (error) {
      logger.error('Error verifying token', { error: error.message });
      return null;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_CONFIG.refreshSecret);
    } catch (error) {
      logger.error('Error verifying refresh token', { error: error.message });
      return null;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token', { error: error.message });
      return null;
    }
  }
}

module.exports = JwtService;
