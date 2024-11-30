const PrismaPaymentMethodRepository = require('../repositories/implementations/PrismaPaymentMethodRepository');

async function testPaymentMethods() {
    const repository = new PrismaPaymentMethodRepository();
    
    console.log('\n=== Testando getAllPaymentMethods ===');
    try {
        const result = await repository.getAllPaymentMethods({}, 0, 10);
        console.log('Sucesso:', result);
    } catch (error) {
        console.error('Erro:', error);
    }

    console.log('\n=== Testando getAllPaymentMethods com filtro active ===');
    try {
        const result = await repository.getAllPaymentMethods({ active: true }, 0, 10);
        console.log('Sucesso:', result);
    } catch (error) {
        console.error('Erro:', error);
    }

    // Criar um método de pagamento para teste
    console.log('\n=== Criando método de pagamento para teste ===');
    let testPaymentMethod;
    try {
        testPaymentMethod = await repository.createPaymentMethod({
            description: 'Método de Teste',
            active: true
        });
        console.log('Método criado:', testPaymentMethod);
    } catch (error) {
        console.error('Erro ao criar:', error);
        return;
    }

    // Testar getById
    console.log('\n=== Testando getPaymentMethodById ===');
    try {
        const result = await repository.getPaymentMethodById(testPaymentMethod.payment_method_id);
        console.log('Sucesso:', result);
    } catch (error) {
        console.error('Erro:', error);
    }

    // Limpar o teste
    console.log('\n=== Limpando dados de teste ===');
    try {
        await repository.deletePaymentMethod(testPaymentMethod.payment_method_id);
        console.log('Método de teste removido com sucesso');
    } catch (error) {
        console.error('Erro ao limpar:', error);
    }
}

testPaymentMethods().catch(console.error);
