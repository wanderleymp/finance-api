const userService = require('./user.service');

class UserController {
    async create(req, res) {
        try {
            const user = await userService.create(req.body);
            res.status(201).json({
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
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
            res.status(400).json({
                message: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            await userService.delete(req.params.id);
            res.status(200).json({
                message: 'User deleted successfully'
            });
        } catch (error) {
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
            res.status(400).json({
                message: error.message
            });
        }
    }

    async list(req, res) {
        try {
            const users = await userService.list(req.query);
            res.status(200).json({
                data: users
            });
        } catch (error) {
            res.status(400).json({
                message: error.message
            });
        }
    }
}

module.exports = new UserController();
