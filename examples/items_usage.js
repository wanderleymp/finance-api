const axios = require('axios');

class ItemsExample {
    constructor(baseURL, token) {
        this.api = axios.create({
            baseURL: baseURL,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async createItem(itemData) {
        try {
            const response = await this.api.post('/items', itemData);
            console.log('Item criado:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar item:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async listItems(filters = {}) {
        try {
            const response = await this.api.get('/items', { params: filters });
            console.log('Items encontrados:', response.data.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao listar items:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async getItemById(itemId) {
        try {
            const response = await this.api.get(`/items/${itemId}`);
            console.log('Detalhes do item:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar item:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async updateItem(itemId, updateData) {
        try {
            const response = await this.api.put(`/items/${itemId}`, updateData);
            console.log('Item atualizado:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao atualizar item:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async deleteItem(itemId) {
        try {
            await this.api.delete(`/items/${itemId}`);
            console.log('Item excluído com sucesso');
        } catch (error) {
            console.error('Erro ao excluir item:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Exemplo de uso completo
    static async runExample() {
        try {
            // NOTA: Substitua com suas credenciais reais
            const token = 'SEU_TOKEN_DE_AUTENTICACAO';
            const baseURL = 'http://localhost:3000/api';
            
            const itemsClient = new ItemsExample(baseURL, token);

            // Criar um novo item
            const newItem = await itemsClient.createItem({
                name: 'Notebook Gamer',
                description: 'Notebook para jogos de alta performance',
                category: 'Eletrônicos',
                price: 5999.99,
                stock_quantity: 10,
                unit: 'UN',
                is_active: true
            });

            // Listar items com filtros
            await itemsClient.listItems({
                category: 'Eletrônicos',
                min_price: 1000,
                max_price: 6000
            });

            // Atualizar o item criado
            await itemsClient.updateItem(newItem.item_id, {
                price: 5499.99,
                stock_quantity: 15
            });

            // Buscar detalhes do item
            await itemsClient.getItemById(newItem.item_id);

            // Excluir o item
            await itemsClient.deleteItem(newItem.item_id);

        } catch (error) {
            console.error('Erro no exemplo:', error);
        }
    }
}

// Descomentar para executar o exemplo
// ItemsExample.runExample();

module.exports = ItemsExample;
