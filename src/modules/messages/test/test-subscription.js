const GraphWebhookService = require('../services/graph-webhook.service');

async function testSubscription() {
    try {
        const webhookService = new GraphWebhookService();
        
        // Criar subscription
        console.log('Criando subscription...');
        const subscription = await webhookService.createSubscription();
        console.log('Subscription criada:', subscription);

        // Testar envio de email
        console.log('Enviando email de teste...');
        const MicrosoftGraphProvider = require('../providers/microsoft-graph.provider');
        const graphProvider = new MicrosoftGraphProvider();
        
        const testEmail = {
            to: [{ email: 'seu.email@teste.com' }],
            subject: 'Teste de Tracking',
            content: '<p>Este é um email de teste para verificar o tracking.</p>',
            metadata: {
                testId: 'test-001'
            }
        };

        const result = await graphProvider.sendMail(
            testEmail.to,
            testEmail.subject,
            testEmail.content,
            testEmail.metadata
        );

        console.log('Email enviado:', result);

    } catch (error) {
        console.error('Erro:', error);
    }
}

testSubscription();
