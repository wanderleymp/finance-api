const axios = require('axios');

const fetchCnpjData = async (cnpj) => {
  try {
    const url = `${process.env.CNPJ_API_URL}${cnpj}`;
    console.log(`Consultando CNPJ: ${url}`);

    const response = await axios.get(url);

    if (response.status === 200) {
      const data = response.data;
      return {
        cnpj: data.cnpj,
        business_name: data.nome,
        trade_name: data.fantasia,
        registration_status: data.situacao,
        address: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
        phone: data.telefone,
        email: data.email,
      };
    } else {
      console.error(`Erro na API ReceitaWS: ${response.statusText}`);
      return null;
    }
  } catch (err) {
    console.error('Erro ao consultar CNPJ:', err.message);
    return null;
  }
};

module.exports = {
  fetchCnpjData,
};
