const logger = require('../middlewares/logger').logger;
const boletoService = require('../services/boletoService');

class BoletoController {
    async index(req, res, next) {
        try {
            console.log('DEBUG: Método index de boletos chamado');
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = req.query;

            const result = await boletoService.listBoletos(page, limit, filters);
            res.status(200).json(result);
        } catch (error) {
            logger.error('Erro no controller de listagem de boletos', { error: error.message });
            res.status(error.status || 500).json({ message: error.message });
        }
    }

    async show(req, res, next) {
        try {
            console.log('DEBUG: Método show de boletos chamado');
            const boletoId = parseInt(req.params.id);
            const boleto = await boletoService.getBoletoById(boletoId);
            res.status(200).json(boleto);
        } catch (error) {
            logger.error('Erro no controller de busca de boleto por ID', { error: error.message });
            res.status(error.status || 500).json({ message: error.message });
        }
    }

    async store(req, res, next) {
        try {
            console.log('DEBUG: Método store de boletos chamado');
            const boletoData = req.body;
            const newBoleto = await boletoService.createBoleto(boletoData);
            res.status(201).json(newBoleto);
        } catch (error) {
            logger.error('Erro no controller de criação de boleto', { error: error.message });
            res.status(error.status || 500).json({ message: error.message });
        }
    }

    async update(req, res, next) {
        try {
            console.log('DEBUG: Método update de boletos chamado');
            const boletoId = parseInt(req.params.id);
            const boletoData = req.body;
            const updatedBoleto = await boletoService.updateBoleto(boletoId, boletoData);
            res.status(200).json(updatedBoleto);
        } catch (error) {
            logger.error('Erro no controller de atualização de boleto', { error: error.message });
            res.status(error.status || 500).json({ message: error.message });
        }
    }

    async delete(req, res, next) {
        try {
            console.log('DEBUG: Método delete de boletos chamado');
            const boletoId = parseInt(req.params.id);
            await boletoService.deleteBoleto(boletoId);
            res.status(204).send();
        } catch (error) {
            logger.error('Erro no controller de deleção de boleto', { error: error.message });
            res.status(error.status || 500).json({ message: error.message });
        }
    }
}

const boletoController = new BoletoController();
module.exports = {
    index: boletoController.index.bind(boletoController),
    show: boletoController.show.bind(boletoController),
    store: boletoController.store.bind(boletoController),
    update: boletoController.update.bind(boletoController),
    delete: boletoController.delete.bind(boletoController)
};
