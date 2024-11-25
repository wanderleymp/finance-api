const pool = require('../../config/db');
const logger = require('../../config/logger');

const getAllUsers = async (req, res) => {
  try {
    logger.info('Buscando todos os usuários');
    const result = await pool.query('SELECT * FROM user_accounts');
    logger.info(`${result.rows.length} usuários encontrados`);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error(`Erro ao buscar usuários: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers };
