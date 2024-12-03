const argon2 = require('argon2');
const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');
const { getPaginationParams, getPaginationMetadata } = require('../utils/pagination');

const userRepository = new PrismaUserRepository();

// GET /users
async function getAllUsers(req, res) {
    try {
        // Processa parâmetros de paginação
        const { page, limit, offset } = getPaginationParams(req.query);
        const search = req.query.search?.trim();

        // Construir where clause baseado nos parâmetros de busca
        const where = {};
        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Buscar usuários com paginação
        const [users, total] = await Promise.all([
            userRepository.getAllUsers(where, offset, limit),
            userRepository.countUsers(where)
        ]);

        // Remove sensitive data
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        // Gera metadados da paginação
        const meta = getPaginationMetadata(total, limit, page);

        // Retorna resposta formatada
        res.json({
            data: sanitizedUsers,
            meta
        });
    } catch (error) {
        logger.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
}

// POST /users
async function createUser(req, res) {
    try {
        const { username, password, email, name, role } = req.body;

        // Validar dados obrigatórios
        if (!username || !password || !email || !name) {
            return res.status(400).json({ 
                error: 'Dados incompletos. Username, password, email e name são obrigatórios.' 
            });
        }

        // Verificar se usuário já existe
        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username já está em uso' });
        }

        // Hash da senha
        const hashedPassword = await argon2.hash(password);

        // Criar usuário
        const user = await userRepository.createUser({
            username,
            password: hashedPassword,
            email,
            name,
            role: role || 'user'
        });

        // Remove sensitive data
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
            data: userWithoutPassword,
            meta: {}
        });
    } catch (error) {
        logger.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
}

// PUT /users/:id
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { username, password, email, name, role } = req.body;

        // Verificar se usuário existe
        const existingUser = await userRepository.findByIdentifier(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Sem permissão para atualizar este usuário' });
        }

        // Preparar dados para atualização
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (role && req.user.role === 'admin') updateData.role = role;
        if (password) {
            updateData.password = await argon2.hash(password);
        }

        // Atualizar usuário
        const updatedUser = await userRepository.updateUser(id, updateData);

        // Remove sensitive data
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({
            data: userWithoutPassword,
            meta: {}
        });
    } catch (error) {
        logger.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
}

// DELETE /users/:id
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Verificar se usuário existe
        const existingUser = await userRepository.findByIdentifier(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Sem permissão para deletar este usuário' });
        }

        await userRepository.deleteUser(id);
        res.status(204).json({
            data: null,
            meta: {}
        });
    } catch (error) {
        logger.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
}

// PATCH /users/:id/password
async function updatePassword(req, res) {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Verificar se usuário existe
        const user = await userRepository.findByIdentifier(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Sem permissão para alterar a senha deste usuário' });
        }

        // Verificar senha atual (exceto para admin)
        if (req.user.role !== 'admin') {
            const validPassword = await argon2.verify(user.password, currentPassword);
            if (!validPassword) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }
        }

        // Atualizar senha
        const hashedPassword = await argon2.hash(newPassword);
        await userRepository.updateUser(id, { password: hashedPassword });

        res.json({
            data: { message: 'Senha atualizada com sucesso' },
            meta: {}
        });
    } catch (error) {
        logger.error('Erro ao atualizar senha:', error);
        res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
}

// GET /users/:id/licenses
async function getUserLicenses(req, res) {
    const startTime = Date.now();
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            logger.warn('ID de usuário inválido', {
                operation: 'getUserLicenses',
                data: { id: req.params.id }
            });
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        logger.info('Iniciando busca de licenças do usuário', {
            operation: 'getUserLicenses',
            data: { id: userId }
        });

        const user = await userRepository.findByIdentifier(userId);
        if (!user) {
            logger.info('Usuário não encontrado', {
                operation: 'getUserLicenses',
                data: { id: userId }
            });
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Garantir que user.licenses existe
        const licenses = user.user_license?.map(ul => ({
            id: ul.licenses.license_id,
            name: ul.licenses.license_name,
            status: ul.licenses.status,
            start_date: ul.licenses.start_date,
            end_date: ul.licenses.end_date,
            active: ul.licenses.active
        })) || [];

        const duration = Date.now() - startTime;
        logger.info('Busca de licenças concluída', {
            operation: 'getUserLicenses',
            duration,
            data: { 
                id: userId,
                licenseCount: licenses.length
            }
        });

        res.json(licenses);
    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Erro ao buscar licenças do usuário', {
            operation: 'getUserLicenses',
            duration,
            error: error.message,
            stack: error.stack,
            data: { id: req.params.id }
        });
        res.status(500).json({ error: 'Erro ao buscar licenças do usuário' });
    }
}

// GET /users/:id/account
async function getUserAccount(req, res) {
    try {
        console.log('=== DEBUG getUserAccount ===');
        console.log('Request Params:', req.params);
        console.log('Request User:', req.user);
        
        const userId = parseInt(req.params.id, 10);
        console.log('Parsed User ID:', userId);
        
        const userAccount = await userRepository.findUserAccountById(userId);
        
        console.log('User Account Found:', userAccount);
        
        if (!userAccount) {
            console.log('User Account Not Found');
            return res.status(404).json({ error: 'Conta de usuário não encontrada' });
        }
        
        return res.json(userAccount);
    } catch (error) {
        console.error('Erro ao buscar conta de usuário:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updatePassword,
    getUserLicenses,
    getUserAccount
};
