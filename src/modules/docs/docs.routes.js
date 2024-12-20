const express = require('express');

module.exports = (controller) => {
    const router = express.Router();

    router.use('/', controller.serve);
    router.get('/', controller.setup);

    return router;
};
