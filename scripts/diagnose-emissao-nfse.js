const EmissaoNfseService = require('../src/modules/nfse/services/emissao-nfse.service');

async function diagnosticarEmissaoNfse() {
  try {
    const emissaoService = new EmissaoNfseService();

    // Dados de exemplo para emissão de NFSe
    const dadosNfse = {
      ambiente: 'homologacao', // Importante usar homologacao para testes
      prestador: {
        cnpj: '38344349000113', // CNPJ da empresa
        inscricaoMunicipal: '123456' // Inscrição Municipal
      },
      tomador: {
        cnpj: '12345678000190', // CNPJ do tomador de serviço
        razaoSocial: 'Empresa Tomadora de Serviços LTDA',
        endereco: {
          logradouro: 'Rua Exemplo',
          numero: '100',
          cidade: 'São Paulo',
          uf: 'SP',
          cep: '01000-000'
        }
      },
      servicos: [
        {
          codigo: '1234', // Código do serviço conforme lista municipal
          descricao: 'Serviço de consultoria',
          valorServicos: 1000.00,
          valorDeducoes: 0,
          valorIss: 50.00
        }
      ]
    };

    console.log('Iniciando emissão de NFSe...');
    const resultado = await emissaoService.emitirNfse(dadosNfse);

    console.log('NFSe emitida com sucesso:');
    console.log('ID:', resultado.id);
    console.log('Número:', resultado.numero);
    console.log('Código de Verificação:', resultado.codigoVerificacao);
    console.log('Status:', resultado.status);
    console.log('Data de Emissão:', resultado.dataEmissao);

  } catch (error) {
    console.error('Erro na emissão de NFSe:', error.message);
    
    // Se houver detalhes adicionais do erro, imprimir
    if (error.response) {
      console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

diagnosticarEmissaoNfse();
