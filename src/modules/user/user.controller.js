const userService = require('./user.service');
const { logger } = require('../../middlewares/logger');

class UserController {
    async create(req, res) {
        try {
            const user = await userService.create(req.body);
            res.status(201).json({
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            logger.error('Error creating user', { error: error.message });
            res.status(400).json({
                message: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const user = await userService.update(req.params.id, req.body);
            res.status(200).json({
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            logger.error('Error updating user', { error: error.message });
            res.status(400).json({
                message: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            await userService.delete(req.params.id);
            res.status(204).send();
        } catch (error) {
            logger.error('Error deleting user', { error: error.message });
            res.status(400).json({
                message: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }
            res.status(200).json({
                data: user
            });
        } catch (error) {
            logger.error('Error getting user', { error: error.message });
            res.status(400).json({
                message: error.message
            });
        }
    }

    async list(req, res) {
        try {
            const result = await userService.list(req.query);
            res.status(200).json(result);
        } catch (error) {
            logger.error('Error listing users', { error: error.message });
            res.status(400).json({
                message: error.message
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await userService.refreshToken(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            logger.error('Error refreshing token', { error: error.message });
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Invalid or expired refresh token'
                });
            }
            res.status(400).json({
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
