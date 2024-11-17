// authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Lógica de Login
const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    console.log('Tentando encontrar usuário com identificador:', identifier);
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      console.log('Usuário não encontrado com identificador:', identifier);
      return res.status(401).send('Invalid identifier or password');
    }

    console.log('Usuário encontrado. Validando senha...');
    const isValid = await User.validatePassword(user, password);
    if (!isValid) {
      console.log('Senha inválida para o usuário:', identifier);
      return res.status(401).send('Invalid identifier or password');
    }

    console.log('Senha válida. Gerando token JWT...');
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
    console.log('Login bem-sucedido para o usuário:', identifier);
  } catch (err) {
    console.error('Erro interno durante o login:', err);
    res.status(500).send('Internal Server Error');
  }
};

// Lógica de Criação de Novo Usuário
/// Registro de Novo Usuário
const userNew = async (req, res) => {
  const { username, password, personId, profileId, licenseId } = req.body;

  if (!username || !password || !personId || !profileId || !licenseId) {
    return res.status(400).json({ message: 'All fields (username, password, personId, profileId, licenseId) are required.' });
  }

  try {
    console.log('Tentando criar novo usuário com username:', username);
    console.log('Iniciando criação de usuário no banco de dados...');
    const userId = await User.create({ username, password, personId, profileId, licenseId });

    res.status(201).json({ message: `User created successfully with ID ${userId}` });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};


// Atualizar senha
const updatePassword = async (req, res) => {
  const { identifier, newPassword } = req.body;

  try {
    console.log('Tentando atualizar a senha para o identificador:', identifier);
    
    // Verificar se os campos necessários foram fornecidos
    if (!identifier || !newPassword) {
      console.log('Erro: Falta de dados obrigatórios para atualizar a senha.');
      return res.status(400).json({ message: 'Identifier and new password are required.' });
    }

    // Chamar a função para atualizar a senha
    const updatedUser = await User.updatePassword(identifier, newPassword);
    if (!updatedUser) {
      console.log('Usuário não encontrado para atualização de senha:', identifier);
      return res.status(404).json({ message: 'Usuário não encontrado para atualização de senha.' });
    }

    console.log(`Senha atualizada com sucesso para o usuário. ID: ${updatedUser.user_id}, Username: ${updatedUser.username}`);
    res.json({ message: `Senha atualizada com sucesso para o usuário. ID ${updatedUser.user_id}, User name: ${updatedUser.username}` });
  } catch (error) {
    console.error('Erro ao atualizar a senha:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Exportar os métodos
module.exports = {
  login,
  userNew,
  updatePassword,
};
