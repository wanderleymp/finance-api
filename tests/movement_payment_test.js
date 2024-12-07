const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMovementPaymentCreation() {
    try {
        // 1. Primeiro, criar um movimento de venda
        const createMovementResponse = await axios.post('http://localhost:3000/sales', {
            customer_id: 1,  // Substitua com um ID de cliente válido
            movement_type_id: 1,  // Substitua com o tipo de movimento correto
            items: [
                {
                    product_id: 1,  // Substitua com um ID de produto válido
                    quantity: 2,
                    unit_price: 100.00
                }
            ]
        });

        const movementId = createMovementResponse.data.id;
        console.log('Movimento criado:', movementId);

        // 2. Criar um pagamento para esse movimento
        const createPaymentResponse = await axios.post(`http://localhost:3000/sales/${movementId}/movement_payment`, {
            payment_method_id: 1,  // Substitua com um método de pagamento válido
            payment_date: new Date().toISOString(),
            amount: 200.00
        });

        const movementPayment = createPaymentResponse.data;
        console.log('Pagamento criado:', movementPayment);

        // 3. Verificar se as parcelas foram geradas
        const installments = await prisma.installment.findMany({
            where: { movement_payment_id: movementPayment.payment_id }
        });

        console.log('Parcelas geradas:', installments);

        if (installments.length === 0) {
            throw new Error('Nenhuma parcela foi gerada');
        }

        console.log('✅ Teste de criação de pagamento de movimento concluído com sucesso!');
    } catch (error) {
        console.error('❌ Erro no teste:', error.response ? error.response.data : error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testMovementPaymentCreation();
