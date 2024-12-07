const express = require('express');
const router = express.Router();
const movementService = require('../services/movements');
const boletoController = require('../controllers/boletoController');
const PrismaMovementPaymentRepository = require('../repositories/implementations/PrismaMovementPaymentRepository');
const InstallmentGenerationService = require('../services/InstallmentGenerationService');

const MOVEMENT_TYPE_SALES = 1;

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Lista todas as vendas
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Busca por nome da pessoa
 *       - in: query
 *         name: person_id
 *         schema:
 *           type: integer
 *         description: ID da pessoa
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final (YYYY-MM-DD)
 *       - in: query
 *         name: license_id
 *         schema:
 *           type: integer
 *         description: ID da licença
 *       - in: query
 *         name: status_id
 *         schema:
 *           type: integer
 *         description: ID do status
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Valor mínimo
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Valor máximo
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [movement_date, total_amount, created_at, updated_at]
 *           default: movement_date
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordem da ordenação
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de vendas paginada com filtros
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            person_id: req.query.person_id,
            license_id: req.query.license_id,
            status_id: req.query.status_id,
            minAmount: req.query.minAmount,
            maxAmount: req.query.maxAmount,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            page: req.query.page,
            limit: req.query.limit
        };

        console.log('DEBUG: Filtros recebidos', { filters });

        const sales = await movementService.list(MOVEMENT_TYPE_SALES, filters);
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Busca uma venda pelo ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda encontrada
 *       404:
 *         description: Venda não encontrada
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await movementService.getById(id);

        if (!sale || sale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        res.json(sale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar venda' });
    }
});

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Cria uma nova venda
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movement_date
 *               - person_id
 *               - total_amount
 *               - license_id
 *               - items
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 */
router.post('/', async (req, res) => {
    try {
        console.log('DEBUG: Dados recebidos para criação de venda', { body: req.body });

        const sale = await movementService.createSaleWithItems(req.body);
        console.log('DEBUG: Venda criada com sucesso', { sale });
        
        res.status(201).json(sale);
    } catch (error) {
        console.error('DEBUG: Erro completo na criação de venda', { 
            error: error.message, 
            stack: error.stack,
            body: req.body 
        });
        res.status(500).json({ 
            error: 'Erro ao criar venda',
            details: error.message,
            stack: error.stack
        });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Atualiza uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda atualizada com sucesso
 *       404:
 *         description: Venda não encontrada
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('DEBUG: Atualizando venda', { 
            id, 
            body: req.body 
        });

        // Verifica se é uma venda
        const existingSale = await movementService.getById(id);
        console.log('DEBUG: Venda encontrada', existingSale);

        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = await movementService.update(id, req.body);
        console.log('DEBUG: Venda atualizada', sale);
        res.json(sale);
    } catch (error) {
        console.error('DEBUG: Erro ao atualizar venda', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'Erro ao atualizar venda' });
    }
});

/**
 * @swagger
 * /sales/{id}:
 *   delete:
 *     summary: Remove uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venda removida com sucesso
 *       404:
 *         description: Venda não encontrada
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se é uma venda
        const existingSale = await movementService.getById(id);
        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        await movementService.delete(id);
        res.json({ message: 'Venda removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover venda' });
    }
});

/**
 * @swagger
 * /sales/{id}/cancel:
 *   post:
 *     summary: Cancela um movimento de venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimento cancelado com sucesso
 *       404:
 *         description: Movimento não encontrado
 */
router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('DEBUG: Rota de cancelamento chamada', { 
            id, 
            method: req.method, 
            originalUrl: req.originalUrl 
        });

        const result = await movementService.cancelMovement(id);
        
        // Se já estiver cancelado, retornar 200 com a mensagem
        if (result.alreadyCancelled) {
            return res.status(200).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cancelar movimento' });
    }
});

/**
 * @swagger
 * /sales/{id}/boleto:
 *   post:
 *     summary: Gerar boleto para uma venda específica
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Solicitação de geração de boleto enviada com sucesso
 *       400:
 *         description: Boleto já existe ou parâmetros inválidos
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/boleto', (req, res) => {
    const movement_id = parseInt(req.params.id);
    const installment_id = req.body.installment_id;

    console.log('DEBUG: Gerando boleto para venda', { 
        movement_id, 
        installment_id, 
        body: req.body 
    });

    return boletoController.generateBoletoWebhook(req, res, { 
        movement_id, 
        installment_id 
    });
});

/**
 * @swagger
 * /sales/{id}/items:
 *   post:
 *     summary: Adiciona itens a uma venda existente
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_id
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                     quantity:
 *                       type: number
 *                     unit_price:
 *                       type: number
 *                     salesperson_id:
 *                       type: integer
 *                     technician_id:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Itens adicionados com sucesso
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro ao adicionar itens
 */
router.post('/:id/items', async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;

        console.log('DEBUG: Adicionando itens à venda', { 
            movementId: id, 
            items: items 
        });

        // Validar se a venda existe
        const existingSale = await movementService.getById(id);
        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            console.log('DEBUG: Venda não encontrada', { 
                movementId: id, 
                existingSale: existingSale 
            });
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // Adicionar itens à venda
        const updatedSale = await movementService.addItems(id, items);
        
        console.log('DEBUG: Itens adicionados com sucesso', { 
            movementId: id, 
            updatedSale: updatedSale 
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Erro detalhado ao adicionar itens à venda', { 
            error: error.message, 
            stack: error.stack,
            body: req.body,
            params: req.params
        });
        res.status(500).json({ 
            error: 'Erro ao adicionar itens à venda', 
            details: error.message 
        });
    }
});

/**
 * @swagger
 * /sales/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove um item de uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removido com sucesso
 *       404:
 *         description: Venda ou item não encontrado
 *       500:
 *         description: Erro ao remover item
 */
router.delete('/:id/items/:itemId', async (req, res) => {
    try {
        const { id, itemId } = req.params;

        console.log('DEBUG: Removendo item da venda', { 
            movementId: id, 
            movementItemId: itemId 
        });

        // Validar se a venda existe
        const existingSale = await movementService.getById(id);
        if (!existingSale || existingSale.movement_type_id !== MOVEMENT_TYPE_SALES) {
            console.log('DEBUG: Venda não encontrada', { 
                movementId: id, 
                existingSale: existingSale 
            });
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // Remover o item e recalcular o total
        const updatedSale = await movementService.deleteItem(id, itemId);
        
        console.log('DEBUG: Item removido com sucesso', { 
            movementId: id, 
            updatedSale: updatedSale 
        });

        res.json(updatedSale);
    } catch (error) {
        console.error('Erro detalhado ao remover item da venda', { 
            error: error.message, 
            stack: error.stack,
            params: req.params
        });
        res.status(500).json({ 
            error: 'Erro ao remover item da venda', 
            details: error.message 
        });
    }
});

/**
 * @swagger
 * /sales/{id}/discount:
 *   put:
 *     summary: Adiciona ou atualiza desconto em uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discount:
 *                 type: number
 *                 description: Valor do desconto
 *     responses:
 *       200:
 *         description: Desconto aplicado com sucesso
 */
router.put('/:id/discount', async (req, res) => {
    try {
        const { id } = req.params;
        const { discount } = req.body;

        if (discount === undefined) {
            return res.status(400).json({ error: 'Desconto é obrigatório' });
        }

        const updatedSale = await movementService.updateMovementDiscount(id, discount);
        res.json(updatedSale);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao aplicar desconto' });
    }
});

/**
 * @swagger
 * /sales/{id}/movement_payment:
 *   post:
 *     summary: Adiciona um pagamento para uma venda
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da venda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_method_id:
 *                 type: integer
 *                 description: ID do método de pagamento
 *               amount:
 *                 type: number
 *                 description: Valor do pagamento
 *     responses:
 *       200:
 *         description: Pagamento adicionado com sucesso
 *       400:
 *         description: Erro na requisição
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:id/movement_payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method_id, amount } = req.body;

        // Validar entrada
        if (!payment_method_id || !amount) {
            return res.status(400).json({ error: 'Dados de pagamento incompletos' });
        }

        // Criar pagamento de movimento usando o serviço de movimentos
        const movementPayment = await movementService.createMovementPayment({
            movement_id: parseInt(id),
            payment_method_id: parseInt(payment_method_id),
            total_amount: parseFloat(amount)
        });

        res.status(201).json(movementPayment);
    } catch (error) {
        console.error('Erro ao adicionar pagamento de movimento:', error);
        res.status(500).json({ error: 'Erro ao processar pagamento', details: error.message });
    }
});

module.exports = router;
