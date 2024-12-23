const UserRoutes = require('./user.routes');
const UserController = require('./user.controller');
const UserService = require('./user.service');
const UserRepository = require('./user.repository');

class UserModule {
    constructor() {
        this.repository = new UserRepository();
        this.service = new UserService({ 
            userRepository: this.repository 
        });
        this.controller = new UserController(this.service);
        this.routes = new UserRoutes(this.controller);
    }

    register(app) {
        app.use('/users', this.routes.getRouter());
    }
}

module.exports = new UserModule();
