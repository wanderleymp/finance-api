const argon2 = require('argon2');
const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');

const userRepository = new PrismaUserRepository();

// GET /users
async function getAllUsers(req, res) {
    try {
        const users = await userRepository.getAllUsers();
        // Remove sensitive data
        const sanitizedUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(sanitizedUsers);
    } catch (error) {
        logger.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
}

// GET /users/:id
async function getUserById(req, res) {
    try {
        const user = await userRepository.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        // Remove sensitive data
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        logger.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
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
        res.status(201).json(userWithoutPassword);
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
        const existingUser = await userRepository.getUserById(id);
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
        res.json(userWithoutPassword);
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
        const existingUser = await userRepository.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Verificar permissão
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: 'Sem permissão para deletar este usuário' });
        }

        await userRepository.deleteUser(id);
        res.status(204).send();
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
        const user = await userRepository.getUserById(id);
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

        res.json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
        logger.error('Erro ao atualizar senha:', error);
        res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updatePassword
};
