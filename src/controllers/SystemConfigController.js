const SystemConfigService = require('../services/SystemConfigService');

class SystemConfigController {
    constructor(pool) {
        this.systemConfigService = new SystemConfigService(pool);
    }

    async getConfig(req, res) {
        try {
            const { configKey } = req.params;
            const config = await this.systemConfigService.getConfig(configKey);
            
            if (!config) {
                return res.status(404).json({ message: 'Configuração não encontrada' });
            }
            
            res.json(config);
        } catch (error) {
            console.error('Erro ao buscar configuração:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    async getAllConfigs(req, res) {
        try {
            const configs = await this.systemConfigService.getAllConfigs();
            res.json(configs);
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    async createOrUpdateConfig(req, res) {
        try {
            const { configKey, configValue, description } = req.body;
            
            if (!configKey || !configValue) {
                return res.status(400).json({ message: 'Chave e valor da configuração são obrigatórios' });
            }

            await this.systemConfigService.createOrUpdateConfig(configKey, configValue, description);
            res.status(200).json({ message: 'Configuração salva com sucesso' });
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    async deleteConfig(req, res) {
        try {
            const { configKey } = req.params;
            await this.systemConfigService.deleteConfig(configKey);
            res.status(200).json({ message: 'Configuração removida com sucesso' });
        } catch (error) {
            console.error('Erro ao remover configuração:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
}

module.exports = SystemConfigController;
