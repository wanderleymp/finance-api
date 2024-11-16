// src/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');  // Sua configuração de conexão ao banco de dados

// Chave secreta para JWT (idealmente armazenada no arquivo .env)
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';

// Registrar um novo usuário
exports.register = async (req, res) => {
    const { person_id, license_id, password } = req.body;

    try {
        // Validar erros no corpo da requisição
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Criptografar senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir novo usuário no banco de dados
        const query = `INSERT INTO users (person_id, license_id, password, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now()) RETURNING *`;
        const values = [person_id, license_id, hashedPassword, true];
        
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).send('Erro no servidor');
    }
};

// Login de usuário
exports.login = async (req, res) => {
    const { person_id, password } = req.body;

    try {
        // Validar erros no corpo da requisição
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Buscar usuário no banco de dados
        const query = `SELECT * FROM users WHERE person_id = $1 AND is_active = true`;
        const values = [person_id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(401).json({ msg: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Comparar senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const payload = {
            user: {
                id: user.id,
                license_id: user.license_id
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).send('Erro no servidor');
    }
};
