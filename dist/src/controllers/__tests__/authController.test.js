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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = require("../authController");
const prisma_1 = __importDefault(require("../../config/prisma"));
const argon2 = __importStar(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock das dependências
jest.mock('../../config/prisma', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn()
    }
}));
jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn()
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn()
}));
describe('Autenticação', () => {
    const mockReq = {
        body: {
            user_name: 'testuser',
            password: 'testpassword'
        }
    };
    const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Registro', () => {
        it('deve registrar um novo usuário com sucesso', async () => {
            prisma_1.default.user.findUnique.mockResolvedValue(null);
            argon2.hash.mockResolvedValue('hashedpassword');
            prisma_1.default.user.create.mockResolvedValue({
                id: 'user-id',
                user_name: 'testuser'
            });
            jsonwebtoken_1.default.sign.mockReturnValue('mocked-token');
            await (0, authController_1.register)(mockReq, mockRes);
            expect(prisma_1.default.user.findUnique).toHaveBeenCalledWith({
                where: { user_name: 'testuser' }
            });
            expect(argon2.hash).toHaveBeenCalledWith('testpassword');
            expect(prisma_1.default.user.create).toHaveBeenCalledWith({
                data: {
                    user_name: 'testuser',
                    password: 'hashedpassword'
                }
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({ token: 'mocked-token' });
        });
        it('deve retornar erro se usuário já existe', async () => {
            prisma_1.default.user.findUnique.mockResolvedValue({
                id: 'existing-user-id'
            });
            await (0, authController_1.register)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Usuário já existe'
            });
        });
    });
    describe('Login', () => {
        it('deve fazer login com sucesso', async () => {
            const mockUser = {
                id: 'user-id',
                user_name: 'testuser',
                password: 'hashedpassword'
            };
            prisma_1.default.user.findUnique.mockResolvedValue(mockUser);
            argon2.verify.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('mocked-token');
            await (0, authController_1.login)(mockReq, mockRes);
            expect(prisma_1.default.user.findUnique).toHaveBeenCalledWith({
                where: { user_name: 'testuser' }
            });
            expect(argon2.verify).toHaveBeenCalledWith('hashedpassword', 'testpassword');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ token: 'mocked-token' });
        });
        it('deve retornar erro se usuário não existe', async () => {
            prisma_1.default.user.findUnique.mockResolvedValue(null);
            await (0, authController_1.login)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Credenciais inválidas'
            });
        });
        it('deve retornar erro se senha for inválida', async () => {
            const mockUser = {
                id: 'user-id',
                user_name: 'testuser',
                password: 'hashedpassword'
            };
            prisma_1.default.user.findUnique.mockResolvedValue(mockUser);
            argon2.verify.mockResolvedValue(false);
            await (0, authController_1.login)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Credenciais inválidas'
            });
        });
    });
});
//# sourceMappingURL=authController.test.js.map