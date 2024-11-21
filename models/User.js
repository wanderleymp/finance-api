const db = require('../config/database');
// const bcrypt = require('bcrypt');
const argon2 = require('argon2');


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
      console.log(`[User] Iniciando a busca pelo identificador: ${identifier}`);
      const result = await db.query(query, [identifier.trim()]);
      if (result.rows.length > 0) {
        console.log(`[User] Usuário encontrado com identificador: ${identifier}`);
      } else {
        console.log(`[User] Nenhum usuário encontrado com identificador: ${identifier}`);
      }
      return result.rows[0];
    } catch (err) {
      console.error('[User] Erro ao buscar por identificador:', err);
      throw err;
    }
  }

  static async validatePassword(user, password) {
    try {
      console.log(`[User] Hash armazenado no banco: ${user.password}`);
      console.log(`[User] Senha fornecida: ${password}`);
      
      console.log(`[User] Iniciando comparação de senha...`);
      const isValid = await argon2.verify(user.password, password);
      
      console.log(`[User] Resultado da validação de senha: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('[User] Erro ao validar senha:', error);
      throw new Error('Erro ao validar senha');
    }
  }

  static async getUserDetails(userId) {
    const query = `
      SELECT *
      FROM vw_user_details
      WHERE user_id = $1
    `;

    try {
      console.log(`[User] Buscando detalhes do usuário com ID: ${userId}`);
      const result = await db.query(query, [userId]);
      console.log(`[User] Detalhes do usuário obtidos: ${JSON.stringify(result.rows[0])}`);
      return result.rows[0];
    } catch (err) {
      console.error('[User] Erro ao obter detalhes do usuário:', err.message);
      throw err;
    }
  }

static async updatePassword(identifier, newPassword) {
  try {
    console.log(`[User] Iniciando atualização de senha para identificador: ${identifier}`);

    // Busca o usuário pelo identificador
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      console.log(`[User] Usuário não encontrado para atualização de senha: ${identifier}`);
      return null;
    }

    console.log(`[User] Usuário encontrado. ID: ${user.user_id}. Gerando novo hash para a senha...`);

    // Gera o hash da nova senha
    const hashedPassword = await argon2.hash(newPassword);
    console.log('[User] Hash gerado com sucesso.');

    // Atualiza a senha no banco de dados
    const query = `
      UPDATE user_accounts
      SET password = $1
      WHERE user_id = $2
      RETURNING user_id, username
    `;
    const result = await db.query(query, [hashedPassword, user.user_id]);

    if (result.rows.length === 0) {
      console.log(`[User] Falha ao atualizar a senha para o usuário ID: ${user.user_id}`);
      return null;
    }

    const updatedUser = result.rows[0];
    console.log(`[User] Senha atualizada com sucesso. ID: ${updatedUser.user_id}, Username: ${updatedUser.username}`);

    return updatedUser;
  } catch (error) {
    console.error('[User] Erro ao atualizar senha:', error);
    throw new Error('Erro ao atualizar senha');
  }
}

static async findUsersWithSharedLicenses(userId) {
  const query = `
    SELECT 
        ua.user_id,
        ua.username,
        ua.person_id,
        (SELECT row_to_json(p.*)::text
         FROM vw_persons_complete p
         WHERE p.person_id = ua.person_id) AS person,
        ARRAY(
            SELECT ul.license_id
            FROM user_license ul
            WHERE ul.user_id = ua.user_id
            AND ul.license_id IN (
                SELECT ul2.license_id
                FROM user_license ul2
                WHERE ul2.user_id = $1
            )
        ) AS license
    FROM user_accounts ua
    WHERE EXISTS (
        SELECT 1
        FROM user_license ul
        WHERE ul.user_id = ua.user_id
        AND ul.license_id IN (
            SELECT ul2.license_id
            FROM user_license ul2
            WHERE ul2.user_id = $1
        )
    )
    ORDER BY ua.username;
  `;

  try {
    console.log('[User] Buscando usuários que compartilham licenças com o usuário:', userId);
    const result = await db.query(query, [userId]);
    console.log(`[User] Total de usuários encontrados: ${result.rows.length}`);
    return result.rows;
  } catch (error) {
    console.error('[User] Erro ao buscar usuários com licenças compartilhadas:', error);
    throw new Error('Erro ao buscar usuários com licenças compartilhadas');
  }
}

}

module.exports = User;
