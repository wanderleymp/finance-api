const db = require('../config/database');
const axios = require('axios');

class Person {
  /**
   * Obtém as pessoas vinculadas ao usuário logado.
   * @param {number} userId - ID do usuário.
   * @returns {Promise<Array>} - Lista de pessoas vinculadas.
   */
  static async getPersonsByUserId(userId) {
    const query = `
      WITH user_licenses AS (
        SELECT ul.license_id
        FROM public.user_license ul
        WHERE ul.user_id = $1
      )
      SELECT p.person_id,
             p.full_name,
             p.birth_date,
             p.created_at,
             p.fantasy_name,
             p.social_capital,
             pt.description AS person_type_description,
             COALESCE((SELECT json_agg(json_build_object('contact_id', c.contact_id, 'contact_type', ct.description, 'contact_value', c.contact_value, 'contact_name', c.contact_name))
                       FROM person_contacts pc
                       JOIN contacts c ON pc.contact_id = c.contact_id
                       JOIN contact_types ct ON c.contact_type_id = ct.contact_type_id
                       WHERE pc.person_id = p.person_id), '[]'::json) AS contacts,
             COALESCE((SELECT json_agg(json_build_object('person_document_id', pd.person_document_id, 'document_type', dt.description, 'document_value', pd.document_value))
                       FROM person_documents pd
                       JOIN document_types dt ON pd.document_type_id = dt.document_type_id
                       WHERE pd.person_id = p.person_id), '[]'::json) AS documents,
             COALESCE((SELECT json_agg(json_build_object('license_id', pl.license_id, 'license_name', l.license_name, 'start_date', l.start_date, 'end_date', l.end_date, 'status', l.status, 'timezone', l.timezone))
                       FROM person_license pl
                       JOIN vw_licenses l ON pl.license_id = l.license_id
                       WHERE pl.person_id = p.person_id AND pl.license_id IN (SELECT license_id FROM user_licenses)), '[]'::json) AS licenses
      FROM persons p
      LEFT JOIN person_types pt ON p.person_type_id = pt.person_type_id
      WHERE EXISTS (
          SELECT 1
          FROM person_license pl
          WHERE pl.person_id = p.person_id
            AND pl.license_id IN (SELECT license_id FROM user_licenses)
      )
      ORDER BY p.full_name;
    `;

    try {
      console.log(`Buscando pessoas para o usuário com ID: ${userId}`);
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (err) {
      console.error('Erro ao buscar pessoas:', err);
      throw err;
    }
  }

    static async consultarCNPJ(cnpj) {
      console.log(`Recebida chamada ao método consultarCNPJ com CNPJ: ${cnpj}`);
      return { message: 'endpoint ok' };
    }
 
  

  
}

module.exports = Person;
