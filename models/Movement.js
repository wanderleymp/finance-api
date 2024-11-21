const db = require('../config/database');

class Movement {
  static async getAllPaginated(offset = 0, limit = 10) {
    const query = `
      SELECT 
        m.*,
        (SELECT row_to_json(p.*) FROM vw_persons_complete p WHERE p.person_id = m.person_id) AS persons,
        (SELECT to_jsonb(l.*) FROM vw_licenses l WHERE l.license_id = m.license_id) AS license,
        json_agg(row_to_json(mp.*)) AS payments,
        json_agg(row_to_json(i.*)) AS installments,
        json_agg(row_to_json(mi.*)) AS items,
        (SELECT row_to_json(nf.*) FROM invoice nf WHERE nf.movement_id = m.movement_id AND nf.status = 'autorizada' AND nf.pdf_url IS NOT NULL ORDER BY nf.created_at DESC LIMIT 1) AS invoices
      FROM movements m
      LEFT JOIN movement_payments mp ON m.movement_id = mp.movement_id
      LEFT JOIN vw_installment i ON mp.payment_id = i.payment_id
      LEFT JOIN vw_movement_items mi ON m.movement_id = mi.movement_id
      GROUP BY m.movement_id
      ORDER BY m.movement_date DESC
      LIMIT $1 OFFSET $2;
    `;

    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('[Movement] Erro ao buscar movimentos paginados:', error);
      throw new Error('Erro ao buscar movimentos paginados');
    }
  }

  static async getTotalCount() {
    const query = 'SELECT COUNT(*) AS total FROM movements';

    try {
      const result = await db.query(query);
      return result.rows[0].total;
    } catch (error) {
      console.error('[Movement] Erro ao contar movimentos:', error);
      throw new Error('Erro ao contar movimentos');
    }
  }
}

module.exports = Movement;
