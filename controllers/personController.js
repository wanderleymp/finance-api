const Person = require('../models/Person');
const CNPJService = require('../services/cnpjService');


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

const getCNPJ = async (req, res) => {
  const { cnpj } = req.params;

  try {
    console.log(`[CNPJController] Recebida requisição para consultar CNPJ: ${cnpj}`);

    // Validar o formato do CNPJ
    const cleanedCNPJ = cnpj.replace(/\D/g, '');
    if (cleanedCNPJ.length !== 14) {
      console.log('[CNPJController] CNPJ inválido:', cnpj);
      return res.status(400).json({ message: 'CNPJ inválido.' });
    }

    // Consultar a API
    const cnpjData = await CNPJService.fetchCNPJData(cleanedCNPJ);
    console.log('[CNPJController] Dados do CNPJ obtidos:', cnpjData);

    // Retornar os dados
    res.json(cnpjData);
  } catch (err) {
    console.error('[CNPJController] Erro ao consultar CNPJ:', err.message);
    res.status(500).json({ message: 'Erro ao consultar CNPJ.' });
  }
};

module.exports = {
  getPersons,
  getCNPJ,
};
