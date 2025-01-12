const NFSeService = require('../src/modules/nfse/services/nfse.service');

async function diagnosticarNfse() {
  try {
    const nfseService = new NFSeService();

    const cnpjEmitente = '38344349000113';
    const resultado = await nfseService.listarNfse(cnpjEmitente);

    console.log('Total de NFSes:', resultado.total);
    
    if (resultado.items && resultado.items.length > 0) {
      resultado.items.forEach((nfse, index) => {
        console.log(`\n--- NFSe #${index + 1} ---`);
        console.log('ID:', nfse.id);
        console.log('Status:', nfse.status);
        console.log('Criado em:', nfse.created_at);
        console.log('Ambiente:', nfse.ambiente);
        console.log('Referência:', nfse.referencia);
        
        if (nfse.numero) console.log('Número:', nfse.numero);
        if (nfse.data_emissao) console.log('Data de Emissão:', nfse.data_emissao);
        
        if (nfse.mensagens && nfse.mensagens.length > 0) {
          console.log('Mensagens:');
          nfse.mensagens.forEach(msg => {
            console.log(`- ${msg.codigo}: ${msg.descricao}`);
          });
        }
      });
    } else {
      console.log('Nenhuma NFSe encontrada.');
    }

  } catch (error) {
    console.error('Erro no diagnóstico:', error);
  }
}

diagnosticarNfse();
