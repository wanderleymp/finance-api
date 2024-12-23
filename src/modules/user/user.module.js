const UserRoutes = require("./user.routes");

class UserModule {
    static register(app) {
        app.use('/api/users', UserRoutes);
    }

    static get routes() {
        return UserRoutes;
    }
}

module.exports = UserModule;
