const companyService = require('./src/services/companyService');

async function testAPI() {
    try {
        console.log('\nTestando API ReceitaWS...\n');
        const result = await companyService.testAPI('47596907000129');
        console.log('\nTeste concluído com sucesso!\n');
    } catch (error) {
        console.error('\nFalha no teste:\n', error);
    }
}

testAPI();
