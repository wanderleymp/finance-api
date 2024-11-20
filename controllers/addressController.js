const Address = require('../models/Address');

// Método para obter as pessoas vinculadas ao usuário logado
const getAddress = async (req, res) => {
  const userId = req.user.userId;

  try {
    console.log(`Requisição para obter enderecos do usuário logado: ${userId}`);
    const address = await Person.getAdress(userId);

    if (!address || address.length === 0) {
      console.log('Nenhuma endereço encontrado.');
      return res.status(404).json({ message: 'Nenhuma endereco encontrado para o usuário logado.' });
    }

    console.log('Enderecos encontrados:', address);
    res.status(200).json(address);
  } catch (err) {
    console.error('Erro ao obter enderecos:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

// Cria um novo endereço
const createAddress = async (req, res) => {
  try {
    const address = await Address.createAddress(req.body);
    res.status(201).json(address);
  } catch (err) {
    console.error('Erro ao criar endereço:', err);
    res.status(500).json({ message: 'Erro interno ao criar endereço.' });
  }
};

// Obtém um endereço pelo ID
const getAddressById = async (req, res) => {
  const { id } = req.params;

  try {
    const address = await Address.getAddressById(id);
    if (!address) {
      return res.status(404).json({ message: 'Endereço não encontrado.' });
    }
    res.status(200).json(address);
  } catch (err) {
    console.error('Erro ao obter endereço:', err);
    res.status(500).json({ message: 'Erro interno ao obter endereço.' });
  }
};

// Atualiza um endereço pelo ID
const updateAddress = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedAddress = await Address.updateAddress(id, req.body);
    if (!updatedAddress) {
      return res.status(404).json({ message: 'Endereço não encontrado para atualização.' });
    }
    res.status(200).json(updatedAddress);
  } catch (err) {
    console.error('Erro ao atualizar endereço:', err);
    res.status(500).json({ message: 'Erro interno ao atualizar endereço.' });
  }
};

// Remove um endereço pelo ID
const deleteAddress = async (req, res) => {
  const { id } = req.params;

  try {
    await Address.deleteAddress(id);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover endereço:', err);
    res.status(500).json({ message: 'Erro interno ao remover endereço.' });
  }
};

module.exports = {
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
  getAddress,
};
