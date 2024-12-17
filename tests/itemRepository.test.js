const ItemRepository = require('../src/repositories/itemRepository');
const { systemDatabase } = require('../src/config/database');
const { ValidationError } = require('../src/utils/errors');

describe('ItemRepository', () => {
    let pool;
    let testItem;

    beforeAll(async () => {
        pool = systemDatabase.pool;
        
        // Limpar tabela de items antes dos testes
        await pool.query('DELETE FROM items');
    });

    afterAll(async () => {
        await pool.end();
    });

    beforeEach(async () => {
        // Criar um item de teste antes de cada teste
        const createResult = await pool.query(`
            INSERT INTO items 
            (name, description, category, price, stock_quantity, unit, is_active) 
            VALUES 
            ('Produto Teste', 'Descrição do Produto', 'Eletrônicos', 100.50, 10, 'UN', true)
            RETURNING *
        `);
        testItem = createResult.rows[0];
    });

    afterEach(async () => {
        // Limpar dados após cada teste
        await pool.query('DELETE FROM items');
    });

    describe('findAll', () => {
        it('deve listar items com filtros básicos', async () => {
            const result = await ItemRepository.findAll(1, 10, {
                name: 'Produto Teste'
            });

            expect(result.data.length).toBe(1);
            expect(result.data[0].name).toBe('Produto Teste');
        });

        it('deve filtrar por categoria', async () => {
            const result = await ItemRepository.findAll(1, 10, {
                category: 'Eletrônicos'
            });

            expect(result.data.length).toBe(1);
            expect(result.data[0].category).toBe('Eletrônicos');
        });

        it('deve filtrar por faixa de preço', async () => {
            const result = await ItemRepository.findAll(1, 10, {
                price: {
                    $gte: 50,
                    $lte: 150
                }
            });

            expect(result.data.length).toBe(1);
            expect(result.data[0].price).toBe(100.50);
        });

        it('deve filtrar por status de ativação', async () => {
            const result = await ItemRepository.findAll(1, 10, {
                is_active: true
            });

            expect(result.data.length).toBe(1);
            expect(result.data[0].is_active).toBe(true);
        });
    });

    describe('findById', () => {
        it('deve buscar item por ID existente', async () => {
            const item = await ItemRepository.findById(testItem.item_id);

            expect(item).toBeTruthy();
            expect(item.name).toBe('Produto Teste');
        });

        it('deve retornar null para ID inexistente', async () => {
            const item = await ItemRepository.findById(99999);

            expect(item).toBeNull();
        });
    });

    describe('create', () => {
        it('deve criar um novo item', async () => {
            const newItemData = {
                name: 'Novo Produto',
                description: 'Descrição do Novo Produto',
                category: 'Informática',
                price: 250.75,
                stock_quantity: 5,
                unit: 'UN',
                is_active: true
            };

            const createdItem = await ItemRepository.create(newItemData);

            expect(createdItem).toBeTruthy();
            expect(createdItem.name).toBe('Novo Produto');
            expect(createdItem.price).toBe(250.75);
        });

        it('deve lançar erro ao tentar criar item duplicado', async () => {
            const duplicateItemData = {
                name: 'Produto Teste',  // Mesmo nome do item de teste
                price: 100
            };

            await expect(ItemRepository.create(duplicateItemData)).rejects.toThrow(ValidationError);
        });
    });

    describe('update', () => {
        it('deve atualizar um item existente', async () => {
            const updateData = {
                name: 'Produto Atualizado',
                price: 200.99
            };

            const updatedItem = await ItemRepository.update(testItem.item_id, updateData);

            expect(updatedItem.name).toBe('Produto Atualizado');
            expect(updatedItem.price).toBe(200.99);
        });

        it('deve lançar erro ao tentar atualizar item inexistente', async () => {
            const updateData = {
                name: 'Produto Inexistente'
            };

            await expect(ItemRepository.update(99999, updateData)).rejects.toThrow(ValidationError);
        });

        it('deve lançar erro se nenhum campo for fornecido', async () => {
            await expect(ItemRepository.update(testItem.item_id, {})).rejects.toThrow(ValidationError);
        });
    });

    describe('delete', () => {
        it('deve excluir um item existente', async () => {
            const deletedItem = await ItemRepository.delete(testItem.item_id);

            expect(deletedItem).toBeTruthy();
            expect(deletedItem.item_id).toBe(testItem.item_id);

            // Verificar se o item realmente foi removido
            const checkItem = await ItemRepository.findById(testItem.item_id);
            expect(checkItem).toBeNull();
        });

        it('deve lançar erro ao tentar excluir item inexistente', async () => {
            await expect(ItemRepository.delete(99999)).rejects.toThrow(ValidationError);
        });
    });
});
