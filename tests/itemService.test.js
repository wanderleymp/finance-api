// Importações e configurações iniciais
const ItemService = require('../src/services/itemService');
const ItemRepository = require('../src/repositories/itemRepository');
const { ValidationError } = require('../src/utils/errors');

// Mock do repositório para isolar testes de serviço
jest.mock('../src/repositories/itemRepository');

describe('ItemService', () => {
    // Limpar mocks antes de cada teste para garantir isolamento
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('listItems', () => {
        // Teste de listagem básica com filtros
        it('deve listar items com filtros', async () => {
            const mockItems = {
                data: [
                    { 
                        item_id: 1, 
                        name: 'Produto Teste', 
                        price: 100.50, 
                        category: 'Eletrônicos' 
                    }
                ],
                total: 1
            };

            // Configura mock do repositório para retornar items filtrados
            ItemRepository.findAll.mockResolvedValue(mockItems);

            // Executa listagem com filtros
            const result = await ItemService.listItems(1, 10, { 
                name: 'Produto Teste',
                category: 'Eletrônicos'
            });

            // Verifica se o resultado corresponde ao esperado
            expect(result.data.length).toBe(1);
            expect(result.data[0].name).toBe('Produto Teste');
            expect(ItemRepository.findAll).toHaveBeenCalledWith(1, 10, expect.objectContaining({
                name: 'Produto Teste',
                category: 'Eletrônicos'
            }));
        });

        // Teste para cenário de lista vazia
        it('deve retornar lista vazia se nenhum item for encontrado', async () => {
            const mockItems = {
                data: [],
                total: 0
            };

            // Configura mock para retornar lista vazia
            ItemRepository.findAll.mockResolvedValue(mockItems);

            // Executa listagem sem filtros
            const result = await ItemService.listItems(1, 10, {});

            // Verifica se a lista está vazia
            expect(result.data.length).toBe(0);
            expect(result.total).toBe(0);
        });

        // Teste para aplicação de filtros de preço
        it('deve aplicar filtros de preço corretamente', async () => {
            const mockItems = {
                data: [
                    { 
                        item_id: 1, 
                        name: 'Produto Teste', 
                        price: 100.50, 
                        category: 'Eletrônicos' 
                    }
                ],
                total: 1
            };

            // Configura mock do repositório para retornar items filtrados por preço
            ItemRepository.findAll.mockResolvedValue(mockItems);

            // Executa listagem com filtros de preço
            const result = await ItemService.listItems(1, 10, { 
                min_price: 50,
                max_price: 150
            });

            // Verifica se o resultado corresponde ao esperado
            expect(result.data.length).toBe(1);
            expect(ItemRepository.findAll).toHaveBeenCalledWith(1, 10, expect.objectContaining({
                min_price: 50,
                max_price: 150
            }));
        });
    });

    describe('getItemById', () => {
        // Teste de busca por ID
        it('deve buscar item por ID', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto Teste', 
                price: 100.50 
            };

            // Configura mock do repositório para retornar item por ID
            ItemRepository.findById.mockResolvedValue(mockItem);

            // Executa busca por ID
            const result = await ItemService.getItemById(1);

            // Verifica se o resultado corresponde ao esperado
            expect(result).toEqual(mockItem);
            expect(ItemRepository.findById).toHaveBeenCalledWith(1);
        });

        // Teste para item não encontrado
        it('deve lançar erro para item não encontrado', async () => {
            // Configura mock para retornar null
            ItemRepository.findById.mockResolvedValue(null);

            // Executa busca por ID inexistente
            await expect(ItemService.getItemById(99999)).rejects.toThrow(ValidationError);
        });
    });

    describe('createItem', () => {
        // Teste de criação de item
        it('deve criar um novo item', async () => {
            const itemData = {
                name: 'Novo Produto',
                price: 250.75,
                category: 'Informática'
            };

            const mockCreatedItem = {
                ...itemData,
                item_id: 1
            };

            // Configura mock do repositório para criar item
            ItemRepository.create.mockResolvedValue(mockCreatedItem);

            // Executa criação de item
            const result = await ItemService.createItem(itemData);

            // Verifica se o resultado corresponde ao esperado
            expect(result).toEqual(mockCreatedItem);
            expect(ItemRepository.create).toHaveBeenCalledWith(itemData);
        });

        // Teste para item sem nome
        it('deve lançar erro para item sem nome', async () => {
            const itemData = {
                price: 250.75
            };

            // Executa criação de item sem nome
            await expect(ItemService.createItem(itemData)).rejects.toThrow(ValidationError);
        });

        // Teste para preço negativo
        it('deve lançar erro para preço negativo', async () => {
            const itemData = {
                name: 'Produto Inválido',
                price: -10
            };

            // Executa criação de item com preço negativo
            await expect(ItemService.createItem(itemData)).rejects.toThrow(ValidationError);
        });

        // Teste para preço zero
        it('deve lançar erro para preço zero', async () => {
            const itemData = {
                name: 'Produto Inválido',
                price: 0
            };

            // Executa criação de item com preço zero
            await expect(ItemService.createItem(itemData)).rejects.toThrow(ValidationError);
        });

        // Teste para item sem preço
        it('deve lançar erro para item sem preço', async () => {
            const itemData = {
                name: 'Produto Sem Preço'
            };

            // Executa criação de item sem preço
            await expect(ItemService.createItem(itemData)).rejects.toThrow(ValidationError);
        });

        // Teste para definição de is_active como true por padrão
        it('deve definir is_active como true por padrão', async () => {
            const itemData = {
                name: 'Novo Produto',
                price: 100.50,
                category: 'Informática'
            };

            const mockCreatedItem = {
                ...itemData,
                item_id: 1,
                is_active: true
            };

            // Configura mock do repositório para criar item
            ItemRepository.create.mockResolvedValue(mockCreatedItem);

            // Executa criação de item
            const result = await ItemService.createItem(itemData);

            // Verifica se o resultado corresponde ao esperado
            expect(result.is_active).toBe(true);
        });
    });

    describe('updateItem', () => {
        // Teste de atualização de item
        it('deve atualizar um item existente', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto Original' 
            };

            const updateData = {
                name: 'Produto Atualizado',
                price: 200.99
            };

            const mockUpdatedItem = {
                ...mockItem,
                ...updateData
            };

            // Configura mock do repositório para atualizar item
            ItemRepository.findById.mockResolvedValue(mockItem);
            ItemRepository.update.mockResolvedValue(mockUpdatedItem);

            // Executa atualização de item
            const result = await ItemService.updateItem(1, updateData);

            // Verifica se o resultado corresponde ao esperado
            expect(result).toEqual(mockUpdatedItem);
            expect(ItemRepository.update).toHaveBeenCalledWith(1, updateData);
        });

        // Teste para preço negativo
        it('deve lançar erro para preço negativo', async () => {
            const updateData = {
                price: -10
            };

            // Executa atualização de item com preço negativo
            await expect(ItemService.updateItem(1, updateData)).rejects.toThrow(ValidationError);
        });

        // Teste para item não encontrado
        it('deve lançar erro para item não encontrado', async () => {
            const updateData = {
                name: 'Produto Atualizado'
            };

            // Configura mock para retornar null
            ItemRepository.findById.mockResolvedValue(null);

            // Executa atualização de item inexistente
            await expect(ItemService.updateItem(99999, updateData)).rejects.toThrow(ValidationError);
        });

        // Teste para preservação de is_active se não especificado
        it('deve preservar is_active se não especificado', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto Original',
                is_active: true
            };

            const updateData = {
                name: 'Produto Atualizado'
            };

            const mockUpdatedItem = {
                ...mockItem,
                ...updateData
            };

            // Configura mock do repositório para atualizar item
            ItemRepository.findById.mockResolvedValue(mockItem);
            ItemRepository.update.mockResolvedValue(mockUpdatedItem);

            // Executa atualização de item
            const result = await ItemService.updateItem(1, updateData);

            // Verifica se o resultado corresponde ao esperado
            expect(result.is_active).toBe(true);
        });

        // Teste para alteração de status de ativação
        it('deve permitir alteração de status de ativação', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto Original',
                is_active: true
            };

            const updateData = {
                is_active: false
            };

            const mockUpdatedItem = {
                ...mockItem,
                ...updateData
            };

            // Configura mock do repositório para atualizar item
            ItemRepository.findById.mockResolvedValue(mockItem);
            ItemRepository.update.mockResolvedValue(mockUpdatedItem);

            // Executa atualização de item
            const result = await ItemService.updateItem(1, updateData);

            // Verifica se o resultado corresponde ao esperado
            expect(result.is_active).toBe(false);
        });
    });

    describe('deleteItem', () => {
        // Teste de exclusão de item
        it('deve excluir um item existente', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto para Exclusão' 
            };

            // Configura mock do repositório para excluir item
            ItemRepository.findById.mockResolvedValue(mockItem);
            ItemRepository.delete.mockResolvedValue(mockItem);

            // Executa exclusão de item
            const result = await ItemService.deleteItem(1);

            // Verifica se o resultado corresponde ao esperado
            expect(result).toBe(true);
            expect(ItemRepository.delete).toHaveBeenCalledWith(1);
        });

        // Teste para item não encontrado
        it('deve lançar erro para item não encontrado', async () => {
            // Configura mock para retornar null
            ItemRepository.findById.mockResolvedValue(null);

            // Executa exclusão de item inexistente
            await expect(ItemService.deleteItem(99999)).rejects.toThrow(ValidationError);
        });

        // Teste para impedir exclusão de item já excluído
        it('deve impedir exclusão de item já excluído', async () => {
            const mockItem = { 
                item_id: 1, 
                name: 'Produto para Exclusão',
                is_active: false
            };

            // Configura mock para retornar item excluído
            ItemRepository.findById.mockResolvedValue(mockItem);

            // Executa exclusão de item já excluído
            await expect(ItemService.deleteItem(1)).rejects.toThrow(ValidationError);
        });
    });
});
