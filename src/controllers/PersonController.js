const { getPaginationParams, getPaginationMetadata } = require('../utils/pagination');
const logger = require('../../config/logger');
const { isValidCNPJ } = require('../utils/validators');
const companyService = require('../services/companyService');
const uuid = require('uuid');

class PersonController {
  constructor(personRepository) {
    this.personRepository = personRepository;
    this.logger = logger;
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      logger.info('=== DELETANDO PESSOA ===', {
        id,
        userId
      });

      const success = await this.personRepository.delete(id, userId);
      
      if (!success) {
        logger.info('Pessoa não encontrada ou sem permissão', { id });
        return res.status(404).json({ error: 'Pessoa não encontrada ou sem permissão' });
      }

      logger.info('Pessoa deletada com sucesso', { id });
      return res.status(204).send();
    } catch (error) {
      logger.error('Erro ao deletar pessoa:', error);
      return res.status(500).json({ error: 'Erro ao deletar pessoa' });
    }
  }

  async listContacts(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { page, limit } = req.query;

      logger.info('=== LISTANDO CONTATOS DA PESSOA ===', {
        id,
        userId,
        page,
        limit
      });

      const result = await this.personRepository.findContactsByPersonId(
        id, 
        userId,
        {
          page: page ? parseInt(page) : undefined,
          limit: limit ? parseInt(limit) : undefined
        }
      );
      
      logger.info('Contatos encontrados', {
        id,
        total: result.meta.total,
        page: result.meta.page,
        limit: result.meta.limit
      });

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao listar contatos da pessoa:', error);
      return res.status(500).json({ error: 'Erro ao listar contatos da pessoa' });
    }
  }

  async removeContact(req, res) {
    try {
      const { personId, contactId } = req.params;
      const userId = req.user.id;

      logger.info('=== REMOVENDO CONTATO DA PESSOA ===', {
        personId,
        contactId,
        userId
      });

      const success = await this.personRepository.removeContact(personId, contactId, userId);
      
      if (!success) {
        logger.info('Contato não encontrado ou sem permissão', { personId, contactId });
        return res.status(404).json({ error: 'Contato não encontrado ou sem permissão' });
      }

      logger.info('Contato removido com sucesso', { personId, contactId });
      return res.status(204).send();
    } catch (error) {
      logger.error('Erro ao remover contato da pessoa:', error);
      return res.status(500).json({ error: 'Erro ao remover contato da pessoa' });
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

  async listDocuments(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Verifica se a pessoa existe
      const person = await this.personRepository.getById(parseInt(id));
      if (!person) {
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      const result = await this.personRepository.listDocuments(
        parseInt(id),
        parseInt(page),
        parseInt(limit)
      );

      return res.json(result);
    } catch (error) {
      console.error('Error listing person documents:', error);
      return res.status(500).json({ error: 'Erro ao listar documentos da pessoa' });
    }
  }

  async addDocument(req, res) {
    try {
      const { id } = req.params;
      const { type_id, value } = req.body;

      if (!type_id || !value) {
        return res.status(400).json({ error: 'Tipo e valor do documento são obrigatórios' });
      }

      // Verifica se a pessoa existe
      const person = await this.personRepository.getById(parseInt(id));
      if (!person) {
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      const document = await this.personRepository.addDocument(parseInt(id), {
        type_id: parseInt(type_id),
        value
      });

      return res.status(201).json({
        message: 'Documento adicionado com sucesso',
        data: document
      });
    } catch (error) {
      console.error('Error adding person document:', error);
      
      if (error.message === 'Tipo de documento não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Pessoa já possui documento deste tipo') {
        return res.status(409).json({ error: error.message });
      }
      
      if (error.message === 'Documento inválido para o tipo selecionado') {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro ao adicionar documento' });
    }
  }

  async removeDocument(req, res) {
    try {
      const { personId, documentId } = req.params;

      // Verifica se a pessoa existe
      const person = await this.personRepository.getById(parseInt(personId));
      if (!person) {
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      await this.personRepository.removeDocument(
        parseInt(personId),
        parseInt(documentId)
      );

      return res.status(204).send();
    } catch (error) {
      console.error('Error removing person document:', error);

      if (error.message === 'Documento não encontrado') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro ao remover documento' });
    }
  }

  async validateDocument(req, res) {
    try {
      const { typeId } = req.params;
      const { value } = req.body;

      if (!value) {
        return res.status(400).json({ error: 'Valor do documento é obrigatório' });
      }

      const result = await this.personRepository.validateDocument(
        parseInt(typeId),
        value
      );

      return res.json(result);
    } catch (error) {
      console.error('Error validating document:', error);

      if (error.message === 'Tipo de documento não encontrado') {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Erro ao validar documento' });
    }
  }

  /**
   * Add a contact to a person
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addContact(req, res) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const personId = parseInt(req.params.id);
      const { contactValue, contactTypeId, contactName } = req.body;
      const userId = req.user.id;

      this.logger.info('=== ADICIONANDO CONTATO ===', {
        requestId,
        personId,
        userId,
        contactValue,
        contactTypeId,
        contactName
      });

      // Validar dados obrigatórios
      if (!personId || !contactValue) {
        this.logger.warn('Dados obrigatórios ausentes', {
          requestId,
          personId,
          contactValue
        });
        return res.status(400).json({
          error: 'Dados obrigatórios ausentes',
          requiredParams: ['personId', 'contactValue'],
          optionalParams: ['contactTypeId', 'contactName']
        });
      }

      // Se contactTypeId for uma string vazia, converte para null
      const finalContactTypeId = contactTypeId === "" ? null : parseInt(contactTypeId);

      // Verifica se a pessoa existe e se o usuário tem acesso
      const person = await this.personRepository.findById(personId, userId);
      if (!person) {
        this.logger.warn('Pessoa não encontrada ou sem acesso', {
          requestId,
          personId,
          userId
        });
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      // Adiciona o contato
      const result = await this.personRepository.addContact({
        contactValue,
        personId,
        contactTypeId: finalContactTypeId,
        contactName,
        userId
      });

      this.logger.info('Contato adicionado com sucesso', {
        requestId,
        personId,
        contactId: result.contact_id
      });

      return res.status(201).json({
        message: 'Contato adicionado com sucesso',
        data: result
      });

    } catch (error) {
      this.logger.error('Erro ao adicionar contato:', {
        requestId,
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('Pessoa não encontrada')) {
        return res.status(404).json({ error: 'Pessoa não encontrada' });
      }

      return res.status(500).json({ 
        error: 'Erro ao adicionar contato',
        details: error.message
      });
    }
  }
}

module.exports = PersonController;
