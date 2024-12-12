const bcrypt = require('bcryptjs');
const db = require('../config/database');
const JwtService = require('../config/jwt');
const { logger } = require('../middlewares/logger');

class UserController {
  // Registro de usuário
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validação básica
      if (!username || !email || !password) {
        return res.status(400).json({ 
          error: 'Dados incompletos',
          message: 'Todos os campos são obrigatórios.'
        });
      }

      // Verificar se usuário já existe
      const existingUser = await db.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2', 
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Usuário já existe',
          message: 'Usuário ou email já cadastrado.'
        });
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Inserir usuário
      const result = await db.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id', 
        [username, email, hashedPassword]
      );

      // Gerar token
      const token = JwtService.generateToken({ 
        id: result.rows[0].id,
        username 
      });

      logger.info(`Usuário registrado: ${username}`);

      return res.status(201).json({ 
        message: 'Usuário criado com sucesso',
        token 
      });

    } catch (error) {
      logger.error('Erro no registro de usuário', { error });
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Não foi possível completar o registro.'
      });
    }
  }

  // Login de usuário
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validação básica
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Dados incompletos',
          message: 'Email e senha são obrigatórios.'
        });
      }

      // Buscar usuário
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1', 
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos.'
        });
      }

      const user = result.rows[0];

      // Verificar senha
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos.'
        });
      }

      // Gerar token
      const token = JwtService.generateToken({ 
        id: user.id,
        username: user.username 
      });

      logger.info(`Usuário logado: ${user.username}`);

      return res.status(200).json({ 
        message: 'Login realizado com sucesso',
        token 
      });

    } catch (error) {
      logger.error('Erro no login de usuário', { error });
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: 'Não foi possível realizar o login.'
      });
    }
  }
}

module.exports = UserController;
