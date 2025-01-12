const ServiceRepository = require('../src/modules/services/service.repository');
const { systemDatabase } = require('../src/config/database');

async function testServiceDetails() {
    const serviceRepository = new ServiceRepository();

    try {
        console.log('Testando findServiceDetails...');
        // Substitua pelo ID de um item de serviço real
        const singleItemId = 1;
        const singleItemDetails = await serviceRepository.findServiceDetails(singleItemId);
        console.log('Detalhes do serviço:', JSON.stringify(singleItemDetails, null, 2));

        console.log('\nTestando findMultipleServiceDetails...');
        // Substitua pelos IDs de itens de serviço reais
        const multipleItemIds = [1, 2, 3];
        const multipleItemsDetails = await serviceRepository.findMultipleServiceDetails(multipleItemIds);
        console.log('Detalhes dos serviços:', JSON.stringify(multipleItemsDetails, null, 2));
    } catch (error) {
        console.error('Erro durante os testes:', error);
    } finally {
        await systemDatabase.pool.end();
    }
}

testServiceDetails();
