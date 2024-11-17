// controllers/authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Lógica de Login
const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findByIdentifier(identifier);
    if (!user) {
      return res.status(401).send('Invalid identifier or password');
    }

    const isValid = await User.validatePassword(user, password);
    if (!isValid) {
      return res.status(401).send('Invalid identifier or password');
    }

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error('Erro interno durante o login:', err);
    res.status(500).send('Internal Server Error');
  }
};

// Lógica de atualização de senha
const updatePassword = async (req, res) => {
  const { identifier, newPassword } = req.body;

  try {
    await User.updatePassword(identifier, newPassword);
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    res.status(500).send('Internal Server Error');
  }
};

// Exportar os métodos
module.exports = {
  login,
  updatePassword,
};
