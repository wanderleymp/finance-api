const bcrypt = require('bcrypt');

// Substitua os valores abaixo pelos dados reais
const hashFromDatabase = '$2b$10$0kf7Mseqkqk6Lj75ejtFAOxp78fFQGnoRwVugrMU1jMj/1nd3Trli'; // Hash do banco
const passwordProvided = '4321'; // Senha fornecida

// Função para validar a senha
const validatePassword = async (hash, password) => {
  try {
    console.log('Iniciando validação da senha...');
    console.log(`Hash do banco: ${hash}`);
    console.log(`Senha fornecida: ${password}`);

    const isValid = await bcrypt.compare(password, hash);

    if (isValid) {
      console.log('Senha válida!');
    } else {
      console.log('Senha inválida!');
    }
  } catch (error) {
    console.error('Erro ao validar senha:', error.message);
  }
};

// Executar a validação
validatePassword(hashFromDatabase, passwordProvided);
