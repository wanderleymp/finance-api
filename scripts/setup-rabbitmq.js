require('dotenv').config();
const axios = require('axios');

async function setupRabbitMQ() {
    const config = {
        auth: {
            username: process.env.RABBITMQ_USER,
            password: process.env.RABBITMQ_PASSWORD
        }
    };

    const vhost = encodeURIComponent(process.env.RABBITMQ_VHOST);
    const baseUrl = `https://rabbitmq.agilefinance.com.br/api`;

    try {
        // 1. Criar o vhost
        console.log(`Criando vhost ${process.env.RABBITMQ_VHOST}...`);
        await axios.put(
            `${baseUrl}/vhosts/${vhost}`,
            {},
            config
        );
        console.log('Vhost criado com sucesso!');

        // 2. Configurar permissões do usuário no vhost
        console.log(`Configurando permissões para o usuário ${process.env.RABBITMQ_USER}...`);
        await axios.put(
            `${baseUrl}/permissions/${vhost}/${process.env.RABBITMQ_USER}`,
            {
                configure: ".*",
                write: ".*",
                read: ".*"
            },
            config
        );
        console.log('Permissões configuradas com sucesso!');

        console.log('Setup do RabbitMQ concluído!');
    } catch (error) {
        if (error.response) {
            console.error('Erro:', error.response.status, error.response.data);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

setupRabbitMQ();
