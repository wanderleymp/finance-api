const Person = require('../models/Person');

// Método para obter as pessoas vinculadas ao usuário logado
const getPersons = async (req, res) => {
  const userId = req.user.userId;

  try {
    console.log(`Requisição para obter pessoas do usuário logado: ${userId}`);
    const persons = await Person.getPersonsByUserId(userId);

    if (!persons || persons.length === 0) {
      console.log('Nenhuma pessoa encontrada.');
      return res.status(404).json({ message: 'Nenhuma pessoa encontrada para o usuário logado.' });
    }

    console.log('Pessoas encontradas:', persons);
    res.status(200).json(persons);
  } catch (err) {
    console.error('Erro ao obter pessoas:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Método para consultar informações de um CNPJ
const getCNPJ = async (req, res) => {
  const userId = req.user.userId; // Obtém o ID do usuário logado
  const { cnpj } = req.params;

  try {
    console.log(`Usuário ${userId} requisitou consulta para CNPJ: ${cnpj}`);
    const dadosCNPJ = await Person.consultarCNPJ(cnpj);

    if (!dadosCNPJ) {
      console.log('Nenhuma informação encontrada para o CNPJ.');
      return res.status(404).json({ message: 'Nenhuma informação encontrada para o CNPJ.' });
    }

    console.log('Informações do CNPJ encontradas:', dadosCNPJ);
    res.status(200).json(dadosCNPJ);
  } catch (err) {
    console.error('Erro ao consultar CNPJ:', err.message);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

module.exports = {
  getPersons,
  getCNPJ,
};
