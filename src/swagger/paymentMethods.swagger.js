/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - description
 *       properties:
 *         payment_method_id:
 *           type: integer
 *           description: ID do método de pagamento
 *         description:
 *           type: string
 *           description: Nome/descrição do método de pagamento
 *         account_entry_id:
 *           type: integer
 *           description: ID da conta contábil associada
 *         active:
 *           type: boolean
 *           description: Status do método de pagamento
 *         account_entries:
 *           type: object
 *           properties:
 *             account_name:
 *               type: string
 *             account_code:
 *               type: string
 */

/**
 * @swagger
 * /payment-methods:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Lista todos os métodos de pagamento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Registros por página
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo/inativo
 *     responses:
 *       200:
 *         description: Lista de métodos de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentMethod'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrevious:
 *                       type: boolean
 *
 *   post:
 *     tags: [Payment Methods]
 *     summary: Cria um novo método de pagamento
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *               account_entry_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Método de pagamento criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       400:
 *         description: Dados inválidos
 *
 * /payment-methods/{id}:
 *   get:
 *     tags: [Payment Methods]
 *     summary: Obtém um método de pagamento específico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Método de pagamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Método de pagamento não encontrado
 *
 *   put:
 *     tags: [Payment Methods]
 *     summary: Atualiza um método de pagamento
 *     security:
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *               account_entry_id:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Método de pagamento atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethod'
 *       404:
 *         description: Método de pagamento não encontrado
 *
 *   delete:
 *     tags: [Payment Methods]
 *     summary: Remove um método de pagamento
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Método de pagamento removido
 *       404:
 *         description: Método de pagamento não encontrado
 */
