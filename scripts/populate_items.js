const { Pool } = require('pg');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do pool de conexão
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Dados de exemplo para população
const sampleItems = [
    {
        name: 'Notebook Dell Inspiron',
        description: 'Notebook para uso profissional e pessoal',
        category: 'Eletrônicos',
        price: 4999.99,
        stock_quantity: 15,
        unit: 'UN',
        is_active: true
    },
    {
        name: 'Smartphone Samsung Galaxy',
        description: 'Smartphone de última geração',
        category: 'Eletrônicos',
        price: 3299.50,
        stock_quantity: 30,
        unit: 'UN',
        is_active: true
    },
    {
        name: 'Monitor LG UltraWide',
        description: 'Monitor profissional para design e produtividade',
        category: 'Informática',
        price: 2599.00,
        stock_quantity: 10,
        unit: 'UN',
        is_active: true
    },
    {
        name: 'Teclado Mecânico Gamer',
        description: 'Teclado mecânico RGB para jogos',
        category: 'Periféricos',
        price: 399.90,
        stock_quantity: 25,
        unit: 'UN',
        is_active: true
    },
    {
        name: 'Mouse Sem Fio',
        description: 'Mouse ergonômico sem fio',
        category: 'Periféricos',
        price: 129.99,
        stock_quantity: 40,
        unit: 'UN',
        is_active: true
    }
];

async function populateItems() {
    const client = await pool.connect();

    try {
        // Iniciar transação
        await client.query('BEGIN');

        // Limpar tabela existente
        await client.query('DELETE FROM items');

        // Popular itens
        for (const item of sampleItems) {
            const { rows } = await client.query(
                `INSERT INTO items 
                (name, description, category, price, stock_quantity, unit, is_active) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING item_id`,
                [
                    item.name, 
                    item.description, 
                    item.category, 
                    item.price, 
                    item.stock_quantity, 
                    item.unit, 
                    item.is_active
                ]
            );
            console.log(`Item ${item.name} criado com ID: ${rows[0].item_id}`);
        }

        // Confirmar transação
        await client.query('COMMIT');
        console.log('População de items concluída com sucesso!');
    } catch (error) {
        // Reverter transação em caso de erro
        await client.query('ROLLBACK');
        console.error('Erro ao popular items:', error);
    } finally {
        client.release();
    }
}

// Executar população se chamado diretamente
if (require.main === module) {
    populateItems()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { populateItems };
