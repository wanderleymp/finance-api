const AuthRoutes = require('./auth.routes');
const AuthController = require('./auth.controller');
const AuthService = require('./auth.service');
const LoginAuditRepository = require('./repositories/loginAudit.repository');
const UserService = require('../user/user.service');
const UserRepository = require('../user/user.repository');

class AuthModule {
    constructor() {
        this.loginAuditRepository = new LoginAuditRepository();
        this.userRepository = new UserRepository();
        this.userService = new UserService({ 
            userRepository: this.userRepository 
        });
        this.service = new AuthService({ 
            loginAuditRepository: this.loginAuditRepository,
            userService: this.userService
        });
        this.controller = new AuthController(this.service);
        this.routes = new AuthRoutes(this.controller);
    }

    register(app) {
        app.use('/auth', this.routes.getRouter());
    }
}

module.exports = new AuthModule();
