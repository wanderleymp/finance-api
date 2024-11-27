/**
 * @swagger
 * components:
 *   schemas:
 *     Person:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID da pessoa
 *         type:
 *           type: string
 *           enum: [PHYSICAL, LEGAL]
 *           description: Tipo de pessoa (física ou jurídica)
 *         full_name:
 *           type: string
 *           description: Nome completo ou razão social
 *         fantasy_name:
 *           type: string
 *           description: Nome fantasia (apenas para pessoa jurídica)
 *         birth_date:
 *           type: string
 *           format: date
 *           description: Data de nascimento ou fundação
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CPF, CNPJ, RG]
 *               value:
 *                 type: string
 *         contacts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [EMAIL, PHONE, WHATSAPP]
 *               value:
 *                 type: string
 *               name:
 *                 type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         cnaes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CNAE'
 *         tax_regime:
 *           $ref: '#/components/schemas/TaxRegime'
 * 
 *     Address:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *         number:
 *           type: string
 *         complement:
 *           type: string
 *         neighborhood:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip_code:
 *           type: string
 *         country:
 *           type: string
 * 
 *     CNAE:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Código CNAE
 *         description:
 *           type: string
 *           description: Descrição da atividade
 *         is_primary:
 *           type: boolean
 *           description: Indica se é a atividade principal
 * 
 *     TaxRegime:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID do regime tributário
 *         name:
 *           type: string
 *           description: Nome do regime tributário
 */
