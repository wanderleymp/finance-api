const NFSeController = require('./nfse.controller');
const NFSeRoutes = require('./nfse.routes.js');
const NFSeService = require('./services/nfse.service');
const NFSeRepository = require('./repositories/nfse.repository');
const { logger } = require('../../middlewares/logger');

class NFSeModule {
  constructor(app) {
    this.app = app;
    this.controller = new NFSeController({
      nfseService: new NFSeService({
        nfseRepository: new NFSeRepository()
      })
    });
    logger.info('NFSeModule: Controlador criado', {
      controllerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.controller))
    });
  }

  register() {
    logger.info('NFSeModule: Registrando rotas', {
      controllerMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(this.controller))
    });
    this.app.use('/nfse', NFSeRoutes(this.controller));
  }

  static register(app) {
    const nfseModule = new NFSeModule(app);
    nfseModule.register();
  }
}

module.exports = NFSeModule;
