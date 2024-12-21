const bcrypt = require('bcrypt');
const IUserService = require('./interfaces/IUserService');
const userRepository = require('./user.repository');
const { logger } = require('../../middlewares/logger');

class UserService extends IUserService {
    constructor() {
        super();
        this.repository = userRepository;
    }

    async findById(id) {
        try {
            return await this.repository.findById(id);
        } catch (error) {
            logger.error('Error finding user by ID', { error: error.message, id });
            throw error;
        }
    }

    async findByUsername(username) {
        try {
            return await this.repository.findByUsername(username);
        } catch (error) {
            logger.error('Error finding user by username', { error: error.message, username });
            throw error;
        }
    }

    async create(data) {
        try {
            // Hash da senha antes de salvar
            const hashedPassword = await bcrypt.hash(data.password, 10);
            
            const userData = {
                ...data,
                password: hashedPassword
            };

            return await this.repository.create(userData);
        } catch (error) {
            logger.error('Error creating user', { error: error.message });
            throw error;
        }
    }

    async update(id, data) {
        try {
            // Se estiver atualizando a senha, fazer o hash
            if (data.password) {
                data.password = await bcrypt.hash(data.password, 10);
            }

            return await this.repository.update(id, data);
        } catch (error) {
            logger.error('Error updating user', { error: error.message, id });
            throw error;
        }
    }

    async delete(id) {
        try {
            await this.repository.delete(id);
        } catch (error) {
            logger.error('Error deleting user', { error: error.message, id });
            throw error;
        }
    }

    async list(filters) {
        try {
            return await this.repository.list(filters);
        } catch (error) {
            logger.error('Error listing users', { error: error.message });
            throw error;
        }
    }
}

module.exports = new UserService();
