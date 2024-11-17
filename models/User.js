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

  static async create({ username, password, personData, contacts, licenseId, profileId }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Etapa 1: Inserir ou verificar a pessoa
      const personQuery = `
        INSERT INTO persons (full_name, birth_date)
        VALUES ($1, $2)
        ON CONFLICT (full_name) DO NOTHING
        RETURNING person_id
      `;
      const personResult = await client.query(personQuery, [personData.fullName, personData.birthDate]);
      let personId = personResult.rows[0]?.person_id;

      if (!personId) {
        const existingPersonQuery = `
          SELECT person_id FROM person_documents
          WHERE UPPER(document_value) = UPPER($1) AND document_type = 'cpf'
        `;
        const existingPersonResult = await client.query(existingPersonQuery, [personData.cpf]);
        personId = existingPersonResult.rows[0]?.person_id;
      }

      if (!personId) {
        throw new Error('Não foi possível criar ou localizar a pessoa.');
      }

      // Etapa 2: Inserir o usuário
      const userQuery = `
        INSERT INTO user_accounts (username, password, person_id, profile_id)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
      `;
      const userResult = await client.query(userQuery, [username, hashedPassword, personId, profileId]);
      const userId = userResult.rows[0].user_id;

      // Etapa 3: Relacionar contatos
      for (const contact of contacts) {
        const contactQuery = `
          INSERT INTO contacts (contact_type, contact_value, is_active)
          VALUES ($1, $2, TRUE)
          ON CONFLICT (contact_value, contact_type) DO NOTHING
          RETURNING contact_id
        `;
        const contactResult = await client.query(contactQuery, [contact.type, contact.value]);
        const contactId = contactResult.rows[0]?.contact_id;

        if (contactId) {
          const personContactQuery = `
            INSERT INTO person_contacts (person_id, contact_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `;
          await client.query(personContactQuery, [personId, contactId]);
        }
      }

      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro ao criar usuário:', err);
      throw err;
    } finally {
      client.release();
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
}

module.exports = User;
