// controllers/personController.js

const Person = require('../models/Person');

// Método para obter as pessoas vinculadas ao usuário logado
const getPersons = async (req, res) => {
  const userId = req.user.userId;

  try {
    console.log(`Requisição para obter pessoas do usuário logado: ${userId}`);
    const persons = await Person.getPersonsByUserId(userId);

    if (!persons || persons.length === 0) {
      return res.status(404).json({ message: 'Nenhuma pessoa encontrada para o usuário logado.' });
    }

    res.status(200).json(persons);
  } catch (err) {
    console.error('Erro ao obter pessoas:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = {
  getPersons,
};
