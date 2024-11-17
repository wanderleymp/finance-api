const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE id IN (SELECT person_id FROM contacts WHERE contact_value = $1 AND contact_type = $2)', [email, 'email']);
    return result.rows[0];
  }

  static async create({ personId, licenseId, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (person_id, license_id, password) VALUES ($1, $2, $3) RETURNING *',
      [personId, licenseId, hashedPassword]
    );
    return result.rows[0];
  }

  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

module.exports = User;
