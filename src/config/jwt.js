const jwt = require('jsonwebtoken');
const { logger } = require('../middlewares/logger');

class JwtService {
  static generateToken(payload) {
    try {
      return jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRATION }
      );
    } catch (error) {
      logger.error('Error generating token', { error: error.message });
      throw error;
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error('Error verifying token', { error: error.message });
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
