const ItemRoutes = require('./item.routes');
const ItemController = require('./item.controller');
const ItemService = require('./item.service');
const ItemRepository = require('./item.repository');

class ItemModule {
    constructor() {
        this.repository = new ItemRepository();
        this.service = new ItemService({ 
            itemRepository: this.repository 
        });
        this.controller = new ItemController(this.service);
        this.routes = ItemRoutes; // ItemRoutes já é uma instância
    }

    register(app) {
        app.use('/items', this.routes.getRouter());
    }
}

module.exports = new ItemModule();
