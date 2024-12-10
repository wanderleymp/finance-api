"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const typeorm_2 = require("../config/typeorm");
const apiErrors_1 = require("../utils/apiErrors");
class UserService {
    userRepository;
    roleRepository;
    constructor() {
        this.userRepository = typeorm_2.AppDataSource.getRepository(User_1.User);
        this.roleRepository = typeorm_2.AppDataSource.getRepository(Role_1.Role);
    }
    async createUser(userData) {
        // Verificar se usuário já existe
        const existingUser = await this.userRepository.findOne({
            where: [
                { email: userData.email },
                { username: userData.username }
            ]
        });
        if (existingUser) {
            throw new apiErrors_1.ApiError('Usuário já cadastrado', 409);
        }
        // Criptografar senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        // Buscar roles
        const roles = userData.roleIds
            ? await this.roleRepository.find({
                where: { id: (0, typeorm_1.In)(userData.roleIds) }
            })
            : [];
        // Criar usuário
        const user = this.userRepository.create({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            person_id: userData.person_id,
            status: User_1.UserStatus.ACTIVE,
            roles: roles
        });
        const savedUser = await this.userRepository.save(user);
        // Remover campos sensíveis
        const { password, ...userWithoutPassword } = savedUser;
        return userWithoutPassword;
    }
    async findUsers(options) {
        const { page, pageSize, search } = options;
        const skip = (page - 1) * pageSize;
        const queryBuilder = this.userRepository.createQueryBuilder('user')
            .select([
            'user.id',
            'user.username',
            'user.email',
            'user.name',
            'user.status',
            'user.lastLogin'
        ])
            .where('user.status != :status', { status: User_1.UserStatus.INACTIVE });
        if (search) {
            queryBuilder.andWhere('(user.username LIKE :search OR user.email LIKE :search OR user.name LIKE :search)', {
                search: `%${search}%`
            });
        }
        const [users, total] = await queryBuilder
            .skip(skip)
            .take(pageSize)
            .getManyAndCount();
        return {
            users,
            total,
            page,
            pageSize
        };
    }
    async updateUser(userId, userData) {
        // Buscar usuário existente
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });
        if (!user) {
            throw new apiErrors_1.ApiError('Usuário não encontrado', 404);
        }
        // Verificar se email já existe
        if (userData.email && userData.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: userData.email }
            });
            if (existingUser) {
                throw new apiErrors_1.ApiError('Email já cadastrado', 409);
            }
        }
        // Atualizar roles se fornecidas
        if (userData.roleIds) {
            const roles = await this.roleRepository.find({
                where: { id: (0, typeorm_1.In)(userData.roleIds) }
            });
            user.roles = roles;
        }
        // Atualizar campos
        user.name = userData.name || user.name;
        user.email = userData.email || user.email;
        user.person_id = userData.person_id || user.person_id;
        const updatedUser = await this.userRepository.save(user);
        // Remover campos sensíveis
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }
    async deactivateUser(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new apiErrors_1.ApiError('Usuário não encontrado', 404);
        }
        user.status = User_1.UserStatus.INACTIVE;
        await this.userRepository.save(user);
    }
    async findUserById(id) {
        const user = await this.userRepository.findOne({
            where: { id: id },
            relations: ['roles']
        });
        if (!user) {
            throw new apiErrors_1.ApiError('Usuário não encontrado', 404);
        }
        // Remover campos sensíveis
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findUserById(id) {
        return await this.userRepository.findOne({
            where: { id },
            relations: ['roles'] // Optional: include related roles if needed
        });
    }
    async findUserByUsername(username) {
        return await this.userRepository.findOne({
            where: { username },
            select: ['id', 'username', 'email', 'status']
        });
    }
    async updateUser(id, userData) {
        const user = await this.findUserById(id);
        if (!user) {
            throw new apiErrors_1.ApiError('Usuário não encontrado', 404);
        }
        // Update basic user information
        if (userData.name)
            user.name = userData.name;
        if (userData.email)
            user.email = userData.email;
        // Handle role updates if roleIds are provided
        if (userData.roleIds && userData.roleIds.length > 0) {
            const roles = await this.roleRepository.find({
                where: { id: (0, typeorm_1.In)(userData.roleIds) }
            });
            if (roles.length !== userData.roleIds.length) {
                throw new apiErrors_1.ApiError('Uma ou mais funções não encontradas', 400);
            }
        }
        return await this.userRepository.save(user);
    }
    async deleteUser(id) {
        const user = await this.findUserById(id);
        if (!user) {
            throw new apiErrors_1.ApiError('Usuário não encontrado', 404);
        }
        // Set user status to INACTIVE instead of hard delete
        user.status = User_1.UserStatus.INACTIVE;
        await this.userRepository.save(user);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=userService.js.map