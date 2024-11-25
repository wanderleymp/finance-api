const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');

const userRepository = new PrismaUserRepository();

const getAllUsers = async (req, res) => {
  try {
    logger.info('Iniciando busca de todos os usuários');
    const users = await userRepository.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    logger.error(`Erro ao buscar usuários: ${error.message}`);
    res.status(500).json({ error: 'Erro interno ao buscar usuários' });
  }
};

module.exports = { getAllUsers };
