const { getPaginationParams, getPaginationMetadata } = require('../utils/pagination');

class UserController {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async list(req, res) {
        try {
            console.log('=== LISTAGEM DE USUÁRIOS ===');
            console.log('Query params:', req.query);

            // Processa parâmetros de paginação
            const { page, limit, offset } = getPaginationParams(req.query);
            const search = req.query.search?.trim();

            console.log('Parâmetros processados:', {
                page,
                limit,
                offset,
                search: search || 'sem filtro'
            });

            // Busca usuários com paginação
            const { users, total } = await this.userRepository.findAll({
                page,
                limit,
                offset,
                search
            });

            // Gera metadados da paginação
            const meta = getPaginationMetadata(total, limit, page);

            console.log('Resultado:', {
                total,
                pagina: page,
                quantidade: users.length
            });

            // Retorna resposta
            res.json({
                data: users,
                meta
            });
        } catch (error) {
            console.error('Erro ao listar usuários:', {
                mensagem: error.message,
                tipo: error.name,
                stack: error.stack?.split('\n')
            });
            res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }
}

module.exports = UserController;
