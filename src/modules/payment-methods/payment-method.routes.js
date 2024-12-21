const { Router } = require('express');

const router = Router();

module.exports = (controller) => {
    // Lista formas de pagamento
    router.get('/', controller.index.bind(controller));

    // Busca forma de pagamento por ID
    router.get('/:id', controller.show.bind(controller));

    // Cria uma nova forma de pagamento
    router.post('/', controller.store.bind(controller));

    // Atualiza uma forma de pagamento
    router.put('/:id', controller.update.bind(controller));

    // Remove uma forma de pagamento
    router.delete('/:id', controller.destroy.bind(controller));

    return router;
};
