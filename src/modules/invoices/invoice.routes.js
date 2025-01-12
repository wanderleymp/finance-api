const { Router } = require('express');
const InvoiceController = require('./invoice.controller');
const InvoiceService = require('./invoice.service');
const { authMiddleware } = require('../../middlewares/auth');
const { validateSchema } = require('../../utils/validateSchema');
const InvoiceSchema = require('./schemas/invoice.schema');

class InvoiceRoutes {
    constructor() {
        this.router = Router();
        this.invoiceController = new InvoiceController(new InvoiceService());
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas (se houver)
        // this.router.get('/public', ...);

        // Todas as outras rotas são protegidas
        this.router.use(authMiddleware);

        // Rotas RESTful básicas
        this.router
            .get('/', 
                this.invoiceController.findAll.bind(this.invoiceController)
            )
            .get('/:id', 
                this.invoiceController.findById.bind(this.invoiceController)
            )
            .get('/reference/:referenceId', 
                this.invoiceController.findByReferenceId.bind(this.invoiceController)
            )
            .post('/', 
                (req, res, next) => validateSchema(InvoiceSchema.create, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.invoiceController.create.bind(this.invoiceController)
            )
            .put('/:id',
                (req, res, next) => validateSchema(InvoiceSchema.update, req.body)
                    .then(validatedData => {
                        req.body = validatedData;
                        next();
                    })
                    .catch(next),
                this.invoiceController.update.bind(this.invoiceController)
            )
            .delete('/:id',
                this.invoiceController.delete.bind(this.invoiceController)
            );
    }

    getRouter() {
        return this.router;
    }
}

module.exports = new InvoiceRoutes();
