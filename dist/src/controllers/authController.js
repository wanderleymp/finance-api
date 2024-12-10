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
exports.login = exports.register = void 0;
const argon2 = __importStar(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = __importDefault(require("../config/prisma.js"));
const env_js_1 = require("../config/env.js");
const register = async (req, res) => {
    try {
        const { user_name, password } = req.body;
        // Verificar se usuário já existe
        const existingUser = await prisma_js_1.default.user.findUnique({
            where: { user_name }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }
        // Hashear senha
        const hashedPassword = await argon2.hash(password);
        // Criar usuário
        const user = await prisma_js_1.default.user.create({
            data: {
                user_name,
                password: hashedPassword
            }
        });
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, user_name: user.user_name }, env_js_1.ENV.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token });
    }
    catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { user_name, password } = req.body;
        // Buscar usuário
        const user = await prisma_js_1.default.user.findUnique({
            where: { user_name }
        });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        // Verificar senha
        const isPasswordValid = await argon2.verify(user.password, password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, user_name: user.user_name }, env_js_1.ENV.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};
exports.login = login;
//# sourceMappingURL=authController.js.map