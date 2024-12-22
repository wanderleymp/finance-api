const { Router } = require('express');
const { validateRequest } = require('../../middlewares/requestValidator');
const { 
    listContactsSchema,
    createContactSchema,
    updateContactSchema
} = require('./validators/contact.validator');
const { authMiddleware } = require('../../middlewares/authMiddleware');

/**
 * @param {ContactController} controller 
 */
module.exports = (contactController) => {
    const router = Router();

    // Rotas protegidas por autenticação
    router.use(authMiddleware);

    router.get('/', 
        validateRequest(listContactsSchema, 'query'),
        contactController.findAll.bind(contactController)
    );

    router.get('/:id', 
        contactController.findById.bind(contactController)
    );

    router.get('/person/:personId', 
        contactController.findByPersonId.bind(contactController)
    );

    router.get('/person/:personId/main', 
        contactController.findMainContactByPersonId.bind(contactController)
    );

    router.post('/', 
        validateRequest(createContactSchema),
        contactController.create.bind(contactController)
    );

    router.put('/:id', 
        validateRequest(updateContactSchema),
        contactController.update.bind(contactController)
    );

    router.delete('/:id', 
        contactController.delete.bind(contactController)
    );

    return router;
};
