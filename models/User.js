// models/User.js

const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async findByIdentifier(identifier) {
    const query = `
      SELECT ua.*
      FROM user_accounts ua
      JOIN persons p ON ua.person_id = p.person_id
      LEFT JOIN person_contacts pc ON p.person_id = pc.person_id
      LEFT JOIN contacts c ON pc.contact_id = c.contact_id
      LEFT JOIN person_documents pd ON p.person_id = pd.person_id
      WHERE UPPER(c.contact_value) = UPPER($1)
         OR UPPER(pd.document_value) = UPPER($1)
      LIMIT 1
    `;

    try {
      console.log(`Iniciando a busca pelo identificador: ${identifier}`);
      const result = await db.query(query, [identifier.trim()]);
      if (result.rows.length > 0) {
        console.log(`Usuário encontrado com identificador: ${identifier}`);
      } else {
        console.log(`Nenhum usuário encontrado com identificador: ${identifier}`);
      }
      return result.rows[0];
    } catch (err) {
      console.error('Erro ao buscar por identificador:', err);
      throw err;
    }
  }

  static async create({ username, password, personId, profileId, licenseId }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      console.log('Iniciando a criação do usuário no banco de dados...');

      // Iniciar a transação
      await db.query('BEGIN');

      // Inserir o novo usuário na tabela user_accounts
      const userQuery = `
        INSERT INTO user_accounts (username, password, person_id, profile_id)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      `;
      const userResult = await db.query(userQuery, [username, hashedPassword, personId, profileId]);
      const userId = userResult.rows[0].user_id;

      console.log(`Usuário criado com sucesso! ID do usuário: ${userId}`);

      // Inserir o relacionamento na tabela user_license
      const licenseQuery = `
        INSERT INTO user_license (user_id, license_id)
        VALUES ($1, $2)
      `;
      await db.query(licenseQuery, [userId, licenseId]);

      console.log(`Licença relacionada ao usuário: ${userId}`);

      // Finalizar a transação
      await db.query('COMMIT');

      return userId;
    } catch (err) {
      // Se ocorrer um erro, desfazer a transação
      await db.query('ROLLBACK');
      console.error('Erro ao criar usuário:', err);
      throw err;
    }
  }

  static async updatePassword(identifier, newPassword) {
    try {
      console.log(`Iniciando atualização de senha para identificador: ${identifier}`);

      // Buscar o usuário pelo identificador
      const user = await User.findByIdentifier(identifier);

      if (!user) {
        console.log(`Usuário não encontrado para atualização de senha: ${identifier}`);
        return null;
      }

      console.log(`Usuário encontrado. ID do usuário: ${user.user_id}, Username: ${user.username}`);

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log(`Senha criptografada com sucesso.`);

      // Query para atualizar a senha
      const updatePasswordQuery = `
        UPDATE user_accounts
        SET password = $1
        WHERE user_id = $2
        RETURNING user_id, username
      `;

      const updateResult = await db.query(updatePasswordQuery, [hashedPassword, user.user_id]);

      if (updateResult.rows.length === 0) {
        console.log(`Erro ao atualizar a senha para o usuário com ID: ${user.user_id}`);
        return null;
      }

      const updatedUser = updateResult.rows[0];
      console.log(`Senha atualizada com sucesso para o usuário. ID: ${updatedUser.user_id}, Username: ${updatedUser.username}`);
      return updatedUser;

    } catch (err) {
      console.error('Erro ao atualizar a senha:', err);
      throw err;
    }
  }


  static async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static async getUserDetails(userId) {
    const query = `
      SELECT *
      FROM vw_user_details
      WHERE user_id = $1
    `;

    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (err) {
      console.error('Erro ao obter detalhes do usuário:', err);
      throw err;
    }
  }
}

module.exports = User;
