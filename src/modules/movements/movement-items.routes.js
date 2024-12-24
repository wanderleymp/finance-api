const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const MovementItemController = require('../movement-items/movement-item.controller');
const { createMovementItemSchema } = require('../movement-items/schemas/create-movement-item.schema');

const router = Router();
const controller = new MovementItemController();

/**
 * @param {MovementController} movementController
 */
module.exports = () => {
    // Lista todos os itens de um movimento
    router.get('/:id/items', async (req, res, next) => {
        try {
            const { id } = req.params;
            const { page, limit, search, orderField, orderDirection } = req.query;

            const result = await controller.findAll({
                movementId: parseInt(id),
                search,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 10,
                order: {
                    field: orderField,
                    direction: orderDirection
                }
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    });

    // Adiciona um novo item ao movimento
    router.post('/:id/items', 
        validateRequest(createMovementItemSchema),
        async (req, res, next) => {
            try {
                const { id } = req.params;
                const movementItem = {
                    ...req.body,
                    movement_id: parseInt(id)
                };

                const result = await controller.create(movementItem);
                res.status(201).json(result);
            } catch (error) {
                next(error);
            }
        }
    );

    return router;
};
