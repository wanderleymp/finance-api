const userService = require('./user.service');

class UserController {
    async create(req, res) {
        try {
            const user = await userService.create(req.body);
            res.status(201).json({
                status: 'success',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const user = await userService.update(req.params.id, req.body);
            res.json({
                status: 'success',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            await userService.delete(req.params.id);
            res.json({
                status: 'success',
                message: 'User deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const user = await userService.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    message: 'User not found'
                });
            }
            res.json({
                status: 'success',
                data: user
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async list(req, res) {
        try {
            const users = await userService.list(req.query);
            res.json({
                status: 'success',
                data: users
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
