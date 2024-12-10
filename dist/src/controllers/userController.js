"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = exports.UpdateUserRequest = exports.CreateUserRequest = void 0;
const userService_1 = require("../services/userService");
const apiErrors_1 = require("../utils/apiErrors");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
// DTOs com validações
class CreateUserRequest {
    username;
    email;
    password;
    name;
}
exports.CreateUserRequest = CreateUserRequest;
class UpdateUserRequest {
    name;
    email;
}
exports.UpdateUserRequest = UpdateUserRequest;
class UserController {
    userService;
    constructor() {
        this.userService = new userService_1.UserService();
    }
    async createUser(req, res) {
        try {
            // Validar entrada
            const createUserDto = (0, class_transformer_1.plainToClass)(CreateUserRequest, req.body);
            await (0, class_validator_1.validateOrReject)(createUserDto);
            const userData = {
                ...createUserDto,
                roleIds: req.body.roleIds || []
            };
            const user = await this.userService.createUser(userData);
            return res.status(201).json(user);
        }
        catch (error) {
            if (error instanceof apiErrors_1.ApiError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            console.error('Erro ao criar usuário:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    async listUsers(req, res) {
        try {
            const page = parseInt(req.query.page || '1', 10);
            const pageSize = parseInt(req.query.pageSize || '10', 10);
            const search = req.query.search;
            const result = await this.userService.findUsers({
                page,
                pageSize,
                search
            });
            return res.json(result);
        }
        catch (error) {
            console.error('Erro ao listar usuários:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await this.userService.findUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            return res.json(user);
        }
        catch (error) {
            if (error instanceof apiErrors_1.ApiError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            console.error('Erro ao buscar usuário:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    async updateUser(req, res) {
        try {
            const userId = req.params.id;
            // Validar entrada
            const updateUserDto = (0, class_transformer_1.plainToClass)(UpdateUserRequest, req.body);
            await (0, class_validator_1.validateOrReject)(updateUserDto);
            const userData = {
                ...updateUserDto,
                roleIds: req.body.roleIds
            };
            const updatedUser = await this.userService.updateUser(userId, userData);
            return res.json(updatedUser);
        }
        catch (error) {
            if (error instanceof apiErrors_1.ApiError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            console.error('Erro ao atualizar usuário:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
    async deleteUser(req, res) {
        try {
            const userId = req.params.id;
            await this.userService.deleteUser(userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof apiErrors_1.ApiError) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            console.error('Erro ao desativar usuário:', error);
            return res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map