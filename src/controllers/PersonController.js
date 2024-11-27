const { getPaginationParams, getPaginationMetadata } = require('../utils/pagination');
const logger = require('../../config/logger');
const { isValidCNPJ } = require('../utils/validators');
const companyService = require('../services/companyService');
const uuid = require('uuid');

class PersonController {
  constructor(personRepository) {
    this.personRepository = personRepository;
  }

  async list(req, res) {
    try {
      logger.info('=== LISTAGEM DE PESSOAS ===');
      logger.info('Query params:', req.query);

      // Processa parâmetros de paginação
      const { page, limit, offset } = getPaginationParams(req.query);
      const search = req.query.search?.trim();
      const userId = req.user.id;

      logger.info('Parâmetros processados:', {
        page,
        limit,
        offset,
        search: search || 'sem filtro',
        userId
      });

      // Busca pessoas com paginação
      const { data, total } = await this.personRepository.findAll({
        page,
        limit,
        offset,
        search,
        userId
      });

      // Gera metadados da paginação
      const meta = getPaginationMetadata(total, limit, page);

      logger.info('Resultado:', {
        total,
        pagina: page,
        quantidade: data.length
      });

      // Retorna resposta
      return res.json({
        data,
        meta
      });
    } catch (error) {
      logger.error('Erro ao listar pessoas:', error);
      return res.status(500).json({ error: 'Erro ao listar pessoas' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      logger.info('=== BUSCA DE PESSOA POR ID ===', {
        id,
        userId
      });

      const person = await this.personRepository.findById(id, userId);
      
      if (!person) {
        logger.info('Pessoa não encontrada', { id });
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      logger.info('Pessoa encontrada', { id });
      return res.json({
        data: person,
        meta: {}
      });
    } catch (error) {
      logger.error('Erro ao buscar pessoa:', error);
      return res.status(500).json({ error: 'Erro ao buscar pessoa' });
    }
  }

  async createByCNPJ(req, res) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const { cnpj } = req.body;
      const userId = req.user.id;
      const licenseId = req.user.license_id;
      
      logger.info('=== CRIAÇÃO DE PESSOA POR CNPJ ===', {
        requestId,
        cnpj,
        userId,
        licenseId
      });

      // 1. Validar CNPJ
      if (!isValidCNPJ(cnpj)) {
        logger.info('CNPJ inválido', { requestId, cnpj });
        return res.status(400).json({ error: 'CNPJ inválido' });
      }

      // 2. Buscar dados na API
      logger.info('Buscando dados na API', { requestId, cnpj });
      const companyData = await companyService.fetchCompanyData(cnpj, requestId);
      if (!companyData) {
        logger.error('Erro ao buscar dados da empresa', { requestId, cnpj });
        return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
      }

      // 3. Criar pessoa
      logger.info('Iniciando criação da pessoa', {
        requestId,
        data: JSON.stringify(companyData)
      });

      const person = await this.personRepository.createByCNPJ({
        ...companyData,
        licenseId: licenseId || userId // Usa license_id se disponível, senão usa userId
      });

      logger.info('Pessoa criada com sucesso', {
        requestId,
        personId: person?.id || person?.person_id
      });

      return res.status(201).json({
        data: person,
        meta: {}
      });
    } catch (error) {
      logger.error('Erro ao criar pessoa jurídica:', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      
      // Retorna 409 se o CNPJ já existe
      if (error.message.includes('já existe')) {
        return res.status(409).json({ error: 'CNPJ já cadastrado' });
      }
      
      return res.status(500).json({ error: error.message || 'Erro ao criar pessoa jurídica' });
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.id;
      const licenseId = req.user.license_id;
      const personData = req.body;

      logger.info('=== CRIAÇÃO DE PESSOA ===', {
        type: personData.type,
        userId
      });

      const person = await this.personRepository.create({
        ...personData,
        userId,
        licenseId
      });

      logger.info('Pessoa criada com sucesso', {
        id: person.person_id,
        type: personData.type
      });

      return res.status(201).json({
        data: person,
        meta: {}
      });
    } catch (error) {
      logger.error('Erro ao criar pessoa:', error);
      return res.status(500).json({ error: 'Erro ao criar pessoa' });
    }
  }

  async testCNPJAPI(req, res) {
    try {
      const { cnpj } = req.query;
      
      if (!cnpj) {
        return res.status(400).json({ error: 'CNPJ é obrigatório' });
      }

      const result = await companyService.testAPI(cnpj);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Erro no teste de API:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message,
        details: error.response?.data || error.stack
      });
    }
  }

  async consultaCNPJ(req, res) {
    try {
      const { cnpj } = req.params;
      const requestId = req.headers['x-request-id'] || uuid.v4();
      
      if (!cnpj) {
        return res.status(400).json({ error: 'CNPJ é obrigatório' });
      }
      
      const result = await companyService.fetchCompanyData(cnpj, requestId);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro na consulta de CNPJ:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message
      });
    }
  }

  async consultaCEP(req, res) {
    try {
      const { cep } = req.params;
      const requestId = req.headers['x-request-id'] || uuid.v4();
      
      if (!cep) {
        return res.status(400).json({ error: 'CEP é obrigatório' });
      }

      const addressService = require('../services/addressService');
      
      const result = await addressService.fetchAddressData(cep, requestId);
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro na consulta de CEP:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = PersonController;
