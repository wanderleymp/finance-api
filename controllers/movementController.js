const Movement = require('../models/Movement');

const getMovementsPaginated = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  // Calcular offset para paginação
  const offset = (page - 1) * limit;

  try {
    // Buscar dados e total de registros
    const movements = await Movement.getAllPaginated(offset, parseInt(limit, 10));
    const total = await Movement.getTotalCount();

    res.json({
      movements,
      pagination: {
        total,
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[MovementController] Erro ao buscar movimentos:', error);
    res.status(500).json({ message: 'Erro ao buscar movimentos' });
  }
};

module.exports = { getMovementsPaginated };
