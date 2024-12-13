const jwt = require('jsonwebtoken');

class JwtService {
  static generateToken(payload) {
    return jwt.sign(
      payload, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRATION }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JwtService;
