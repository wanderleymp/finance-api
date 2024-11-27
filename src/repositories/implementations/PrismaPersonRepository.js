const { PrismaClient } = require('@prisma/client');
const logger = require('../../../config/logger');
const CepService = require('../../services/CepService');

class PrismaPersonRepository {
  constructor(prisma, logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  async findAll({ page, limit, offset, search, userId }) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('=== LISTAGEM DE PESSOAS ===', {
        requestId,
        params: { page, limit, offset, search, userId }
      });

      // Buscar licenças do usuário
      const userLicenses = await this.getLicenseIdsByUserId(userId);
      logger.info('Licenças do usuário encontradas:', {
        requestId,
        licenseCount: userLicenses.length,
        licenses: userLicenses
      });

      // Construir where clause para busca
      const whereClause = {
        AND: [
          {
            person_license: {
              some: {
                license_id: {
                  in: userLicenses
                }
              }
            }
          }
        ]
      };

      // Adicionar condições de busca se houver termo de pesquisa
      if (search?.trim()) {
        const searchTerm = search.trim();
        logger.info('Aplicando filtro de busca:', {
          requestId,
          searchTerm,
          searchFields: ['full_name', 'fantasy_name', 'document_value', 'contact_value']
        });

        whereClause.AND.push({
          OR: [
            { full_name: { contains: searchTerm, mode: 'insensitive' } },
            { fantasy_name: { contains: searchTerm, mode: 'insensitive' } },
            {
              person_documents: {
                some: {
                  document_value: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              person_contacts: {
                some: {
                  contacts: {
                    contact_value: { contains: searchTerm, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        });
      }

      // Configurar paginação
      const paginationOptions = {};
      if (limit !== undefined) {
        paginationOptions.take = limit;
        if (offset !== undefined) {
          paginationOptions.skip = offset;
        } else if (page !== undefined) {
          paginationOptions.skip = (page - 1) * limit;
        }
      }

      logger.info('Executando busca com os parâmetros:', {
        requestId,
        where: JSON.stringify(whereClause, null, 2),
        pagination: paginationOptions
      });

      // Executar query
      const [total, result] = await Promise.all([
        this.prisma.persons.count({
          where: whereClause
        }),
        this.prisma.persons.findMany({
          where: whereClause,
          include: {
            person_types: true,
            person_documents: {
              include: {
                document_types: true
              }
            },
            person_contacts: {
              include: {
                contacts: {
                  include: {
                    contact_types: true
                  }
                }
              }
            },
            addresses: true,
            person_cnae: {
              include: {
                cnae: true
              }
            },
            person_tax_regimes: {
              include: {
                tax_regimes: true
              }
            }
          },
          orderBy: {
            full_name: 'asc'
          },
          ...paginationOptions
        })
      ]);

      logger.info('Resultado da busca:', {
        requestId,
        totalRegistros: total,
        registrosRetornados: result?.length || 0,
        primeiroRegistro: result?.[0]?.full_name,
        campos: result?.[0] ? Object.keys(result[0]) : []
      });

      // Formatar dados
      const data = result.map(person => ({
        id: person.person_id,
        type: person.person_types?.type || null,
        full_name: person.full_name || '',
        fantasy_name: person.fantasy_name || '',
        birth_date: person.birth_date || null,
        documents: Array.isArray(person.person_documents) 
          ? person.person_documents.map(doc => ({
              type: doc.document_types?.type || null,
              value: doc.document_value || ''
            }))
          : [],
        contacts: Array.isArray(person.person_contacts)
          ? person.person_contacts.map(contact => ({
              type: contact.contacts?.contact_types?.type || null,
              value: contact.contacts?.contact_value || '',
              name: contact.contacts?.contact_name || ''
            }))
          : [],
        address: Array.isArray(person.addresses) && person.addresses.length > 0
          ? {
              street: person.addresses[0].street || '',
              number: person.addresses[0].number || '',
              complement: person.addresses[0].complement || '',
              neighborhood: person.addresses[0].neighborhood || '',
              city: person.addresses[0].city || '',
              state: person.addresses[0].state || '',
              zip_code: person.addresses[0].zip_code || '',
              country: person.addresses[0].country || ''
            }
          : null,
        cnaes: Array.isArray(person.person_cnae)
          ? person.person_cnae.map(cnaeItem => ({
              code: cnaeItem.cnae?.code || '',
              description: cnaeItem.cnae?.description || '',
              is_primary: Boolean(cnaeItem.is_primary)
            }))
          : [],
        tax_regime: person.person_tax_regimes?.[0]?.tax_regimes
          ? {
              id: person.person_tax_regimes[0].tax_regimes.tax_regime_id || null,
              name: person.person_tax_regimes[0].tax_regimes.name || ''
            }
          : null
      }));

      logger.info('Dados formatados:', {
        requestId,
        totalFormatado: data.length,
        campos: data?.[0] ? Object.keys(data[0]) : []
      });

      return {
        data,
        total,
        page: page || 1,
        limit: limit || total,
        pages: limit ? Math.ceil(total / limit) : 1
      };

    } catch (error) {
      logger.error('Erro ao buscar pessoas:', {
        requestId,
        erro: error.message,
        stack: error.stack,
        where: whereClause,
        pagination: paginationOptions
      });
      throw error;
    }
  }

  async findAllWithRelations({ page, limit, offset, search, userId }) {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
      logger.info('=== LISTAGEM DE PESSOAS COM RELAÇÕES ===', {
        requestId,
        params: { page, limit, offset, search, userId }
      });

      // Buscar licenças do usuário
      const userLicenses = await this.getLicenseIdsByUserId(userId);
      logger.info('Licenças do usuário encontradas:', {
        requestId,
        licenseCount: userLicenses.length,
        licenses: userLicenses
      });

      // Construir where clause para busca
      const where = {
        AND: [
          {
            person_license: {
              some: {
                license_id: {
                  in: userLicenses
                }
              }
            }
          }
        ]
      };

      // Adicionar condições de busca se houver termo de pesquisa
      if (search?.trim()) {
        const searchTerm = search.trim();
        logger.info('Aplicando filtro de busca:', {
          requestId,
          searchTerm,
          searchFields: ['full_name', 'fantasy_name', 'document_value', 'contact_value']
        });

        where.AND.push({
          OR: [
            { full_name: { contains: searchTerm, mode: 'insensitive' } },
            { fantasy_name: { contains: searchTerm, mode: 'insensitive' } },
            {
              person_documents: {
                some: {
                  document_value: { contains: searchTerm, mode: 'insensitive' }
                }
              }
            },
            {
              person_contacts: {
                some: {
                  contacts: {
                    contact_value: { contains: searchTerm, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        });
      }

      // Configurar paginação
      const paginationOptions = {};
      if (limit !== undefined) {
        paginationOptions.take = limit;
        if (offset !== undefined) {
          paginationOptions.skip = offset;
        } else if (page !== undefined) {
          paginationOptions.skip = (page - 1) * limit;
        }
      }

      logger.info('Executando busca com os parâmetros:', {
        requestId,
        where: JSON.stringify(where, null, 2),
        pagination: paginationOptions
      });

      // Executar query
      const [total, rawData] = await Promise.all([
        this.prisma.persons.count({
          where
        }),
        this.prisma.persons.findMany({
          where,
          include: {
            person_types: true,
            person_documents: {
              include: {
                document_types: true
              }
            },
            person_contacts: {
              include: {
                contacts: {
                  include: {
                    contact_types: true
                  }
                }
              }
            },
            addresses: true,
            person_cnae: {
              include: {
                cnae: true
              }
            },
            person_tax_regimes: {
              include: {
                tax_regimes: true
              }
            }
          },
          orderBy: {
            full_name: 'asc'
          },
          ...paginationOptions
        })
      ]);

      logger.info('Dados brutos obtidos do banco', {
        requestId,
        operation: 'findAllWithRelations',
        totalCount: total,
        rawDataReceived: !!rawData,
        rawDataType: typeof rawData,
        isArray: Array.isArray(rawData),
        rawDataLength: rawData ? rawData.length : 0
      });

      // Garantir que rawData é um array
      const data = Array.isArray(rawData) ? rawData : [];

      // Formatar resposta com tratamento de nulos
      const formattedData = data.map(person => {
        const formatted = {
          id: person.person_id,
          type: person.person_types?.type || null,
          full_name: person.full_name || '',
          fantasy_name: person.fantasy_name || '',
          birth_date: person.birth_date || null,
          documents: [],
          contacts: [],
          address: null,
          cnaes: [],
          tax_regime: null
        };

        // Processar documentos
        if (Array.isArray(person.person_documents)) {
          formatted.documents = person.person_documents.map(doc => ({
            type: doc.document_types?.type || null,
            value: doc.document_value || ''
          }));
        }

        // Processar contatos
        if (Array.isArray(person.person_contacts)) {
          formatted.contacts = person.person_contacts.map(contact => ({
            type: contact.contacts?.contact_types?.type || null,
            value: contact.contacts?.contact_value || '',
            name: contact.contacts?.contact_name || ''
          }));
        }

        // Processar endereço
        if (Array.isArray(person.addresses) && person.addresses.length > 0) {
          formatted.address = {
            street: person.addresses[0].street || '',
            number: person.addresses[0].number || '',
            complement: person.addresses[0].complement || '',
            neighborhood: person.addresses[0].neighborhood || '',
            city: person.addresses[0].city || '',
            state: person.addresses[0].state || '',
            zip_code: person.addresses[0].zip_code || '',
            country: person.addresses[0].country || ''
          };
        }

        // Processar CNAEs
        if (Array.isArray(person.person_cnae)) {
          formatted.cnaes = person.person_cnae.map(cnaeItem => ({
            code: cnaeItem.cnae?.code || '',
            description: cnaeItem.cnae?.description || '',
            is_primary: Boolean(cnaeItem.is_primary)
          }));
        }

        // Processar regime tributário
        if (person.person_tax_regimes?.[0]?.tax_regimes) {
          formatted.tax_regime = {
            id: person.person_tax_regimes[0].tax_regimes.tax_regime_id || null,
            name: person.person_tax_regimes[0].tax_regimes.name || ''
          };
        }

        return formatted;
      });

      logger.info('Dados formatados com sucesso', {
        requestId,
        operation: 'findAllWithRelations',
        formattedCount: formattedData.length,
        sampleData: formattedData.length > 0 ? {
          id: formattedData[0].id,
          type: formattedData[0].type,
          documentsCount: formattedData[0].documents.length,
          contactsCount: formattedData[0].contacts.length,
          hasAddress: !!formattedData[0].address,
          cnaesCount: formattedData[0].cnaes.length,
          hasTaxRegime: !!formattedData[0].tax_regime
        } : null
      });

      const response = {
        data: formattedData,
        total,
        page: page || 1,
        limit: limit || total,
        pages: limit ? Math.ceil(total / limit) : 1
      };

      const endTime = Date.now();
      logger.info('Busca concluída com sucesso', {
        requestId,
        operation: 'findAllWithRelations',
        duration: endTime - startTime,
        responseSize: {
          total,
          dataLength: formattedData.length,
          page: response.page,
          limit: response.limit,
          pages: response.pages
        }
      });

      return response;

    } catch (error) {
      const endTime = Date.now();
      logger.error('Erro ao buscar pessoas', {
        requestId,
        operation: 'findAllWithRelations',
        duration: endTime - startTime,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async findById(id, userId) {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    try {
      logger.info('Iniciando busca de pessoa por ID', {
        requestId,
        operation: 'findById',
        params: { id, userId }
      });

      const person = await this.prisma.persons.findFirst({
        where: {
          person_id: parseInt(id),
          // Filtro por licença
          person_license: {
            some: {
              license_id: {
                in: await this.getLicenseIdsByUserId(userId)
              }
            }
          }
        },
        include: {
          person_types: true,
          person_documents: {
            include: {
              document_types: true
            }
          },
          person_contacts: {
            include: {
              contacts: {
                include: {
                  contact_types: true
                }
              }
            }
          },
          addresses: true,
          person_cnae: {
            include: {
              cnae: true
            }
          },
          person_tax_regimes: {
            include: {
              tax_regimes: true
            }
          }
        }
      });

      logger.info('Pessoa encontrada', {
        requestId,
        operation: 'findById',
        personId: person?.person_id,
        found: !!person
      });

      if (!person) {
        return null;
      }

      // Formatar resposta
      const formattedPerson = {
        id: person.person_id,
        type: person.person_types?.type || null,
        full_name: person.full_name || '',
        fantasy_name: person.fantasy_name || '',
        birth_date: person.birth_date || null,
        documents: [],
        contacts: [],
        address: null,
        cnaes: [],
        tax_regime: null
      };

      // Processar documentos
      if (Array.isArray(person.person_documents)) {
        formattedPerson.documents = person.person_documents.map(doc => ({
          type: doc.document_types?.type || null,
          value: doc.document_value || ''
        }));
      }

      // Processar contatos
      if (Array.isArray(person.person_contacts)) {
        formattedPerson.contacts = person.person_contacts.map(contact => ({
          type: contact.contacts?.contact_types?.type || null,
          value: contact.contacts?.contact_value || '',
          name: contact.contacts?.contact_name || ''
        }));
      }

      // Processar endereço
      if (Array.isArray(person.addresses) && person.addresses.length > 0) {
        formattedPerson.address = {
          street: person.addresses[0].street || '',
          number: person.addresses[0].number || '',
          complement: person.addresses[0].complement || '',
          neighborhood: person.addresses[0].neighborhood || '',
          city: person.addresses[0].city || '',
          state: person.addresses[0].state || '',
          zip_code: person.addresses[0].zip_code || '',
          country: person.addresses[0].country || ''
        };
      }

      // Processar CNAEs
      if (Array.isArray(person.person_cnae)) {
        formattedPerson.cnaes = person.person_cnae.map(cnaeItem => ({
          code: cnaeItem.cnae?.code || '',
          description: cnaeItem.cnae?.description || '',
          is_primary: Boolean(cnaeItem.is_primary)
        }));
      }

      // Processar regime tributário
      if (person.person_tax_regimes?.[0]?.tax_regimes) {
        formattedPerson.tax_regime = {
          id: person.person_tax_regimes[0].tax_regimes.tax_regime_id || null,
          name: person.person_tax_regimes[0].tax_regimes.name || ''
        };
      }

      logger.info('Pessoa formatada com sucesso', {
        requestId,
        operation: 'findById',
        personId: formattedPerson.id,
        type: formattedPerson.type,
        documentsCount: formattedPerson.documents.length,
        contactsCount: formattedPerson.contacts.length,
        hasAddress: !!formattedPerson.address,
        cnaesCount: formattedPerson.cnaes.length,
        hasTaxRegime: !!formattedPerson.tax_regime
      });

      return formattedPerson;

    } catch (error) {
      const endTime = Date.now();
      logger.error('Erro ao buscar pessoa por ID', {
        requestId,
        operation: 'findById',
        duration: endTime - startTime,
        errorType: error.constructor.name,
        errorMessage: error.message,
        errorStack: error.stack,
        params: { id, userId }
      });
      throw error;
    }
  }

  async findByDocument(documentValue, userLicenses) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('Iniciando busca de pessoa por documento', {
        requestId,
        documentValue
      });

      const person = await this.prisma.persons.findFirst({
        where: {
          AND: [
            {
              person_documents: {
                some: {
                  document_value: documentValue
                }
              }
            },
            {
              person_license: {
                some: {
                  license_id: {
                    in: userLicenses
                  }
                }
              }
            }
          ]
        },
        include: {
          person_types: true,
          person_documents: {
            include: {
              document_types: true
            }
          }
        }
      });

      logger.info('Resultado da busca por documento:', {
        requestId,
        encontrado: !!person,
        personId: person?.person_id
      });

      return person;
    } catch (error) {
      logger.error('Erro ao buscar pessoa por documento:', {
        requestId,
        erro: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async findExistingPerson(fullName, documentValue) {
    try {
      const person = await this.prisma.persons.findFirst({
        where: {
          OR: [
            {
              full_name: fullName
            },
            {
              person_documents: {
                some: {
                  document_value: documentValue
                }
              }
            }
          ]
        },
        include: {
          person_documents: true,
          person_license: true
        }
      });

      return person;
    } catch (error) {
      logger.error('Erro ao buscar pessoa existente:', error);
      throw error;
    }
  }

  async create(personData, userId) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('Iniciando criação/atualização de pessoa', {
        requestId,
        fullName: personData.full_name,
        documents: personData.documents
      });

      // Verificar se a pessoa já existe
      const existingPerson = await this.findExistingPerson(
        personData.full_name,
        personData.documents?.[0]?.value
      );

      if (existingPerson) {
        logger.info('Pessoa já existe, atualizando...', {
          requestId,
          personId: existingPerson.person_id
        });

        // Atualizar pessoa existente
        const updated = await this.prisma.persons.update({
          where: {
            person_id: existingPerson.person_id
          },
          data: {
            fantasy_name: personData.fantasy_name,
            birth_date: personData.birth_date,
            // Atualizar outros campos conforme necessário
            person_license: {
              create: {
                license_id: userId
              }
            }
          }
        });

        return updated;
      }

      // Criar nova pessoa
      logger.info('Criando nova pessoa', {
        requestId,
        data: personData
      });

      const created = await this.prisma.persons.create({
        data: {
          full_name: personData.full_name,
          fantasy_name: personData.fantasy_name,
          birth_date: personData.birth_date,
          person_documents: {
            create: personData.documents?.map(doc => ({
              document_value: doc.value,
              document_type_id: doc.type_id
            }))
          },
          person_license: {
            create: {
              license_id: userId
            }
          }
        }
      });

      return created;
    } catch (error) {
      logger.error('Erro ao criar/atualizar pessoa:', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async createByCNPJ(data) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      this.logger.info('=== [1/2] INICIANDO CRIAÇÃO POR CNPJ ===', {
        requestId,
        data: JSON.stringify(data, null, 2)
      });

      // Validar dados obrigatórios
      if (!data.full_name || !data.documents?.[0]?.document_value || !data.licenseId) {
        throw new Error('Dados obrigatórios ausentes');
      }

      // Chamar a função do banco de dados
      const result = await this.prisma.$queryRaw`
        SELECT * FROM fn_person_insert(
          ${data.full_name}::varchar,                   -- p_full_name
          ${2}::integer,                                -- p_person_type_id
          ${2}::integer,                                -- p_document_type_id
          ${data.documents[0].document_value}::varchar,  -- p_document_value
          ${data.licenseId}::integer,                    -- p_license_id
          ${data.fantasy_name}::varchar,                 -- p_fantasy_name
          ${data.social_capital || null}::numeric,       -- p_social_capital
          ${data.birth_date}::date,                      -- p_birth_date
          ${data.addresses[0].street}::varchar,          -- p_street
          ${data.addresses[0].number}::varchar,          -- p_number
          ${data.addresses[0].complement}::varchar,      -- p_complement
          ${data.addresses[0].neighborhood}::varchar,    -- p_neighborhood
          ${data.addresses[0].city}::varchar,           -- p_city
          ${data.addresses[0].state}::varchar,          -- p_state
          ${data.addresses[0].postal_code}::varchar,    -- p_postal_code
          ${data.addresses[0].country}::varchar,        -- p_country
          ${null}::integer,                             -- p_ibge
          ${data.email || null}::varchar,               -- p_email
          ${null}::varchar,                             -- p_contact_name
          ${JSON.stringify(data.atividade_principal)}::jsonb,      -- p_atividade_principal
          ${JSON.stringify(data.atividades_secundarias)}::jsonb,   -- p_atividades_secundarias
          ${JSON.stringify(data.qsa)}::jsonb,           -- p_qsa
          ${data.simples}::boolean,                     -- p_simples_nacional
          ${data.mei}::boolean,                         -- p_simei
          ${data.telefone || null}::varchar             -- p_whatsapp
        )
      `;

      this.logger.info('Resultado da função:', {
        requestId,
        result: JSON.stringify(result)
      });

      const personId = result[0]?.person_id;
      if (!personId) {
        throw new Error('ID da pessoa não retornado pela função');
      }
      
      this.logger.info('=== [2/2] PESSOA CRIADA COM SUCESSO ===', {
        requestId,
        personId
      });

      // Buscar a pessoa criada
      return await this.findById(personId);

    } catch (error) {
      this.logger.error('Erro fatal na criação por CNPJ:', {
        requestId,
        error: error.message,
        stack: error.stack,
        data: JSON.stringify(data, null, 2)
      });

      if (error.message.includes('duplicate key value violates unique constraint')) {
        throw new Error('CNPJ já existe na base de dados');
      }

      throw error;
    }
  }

  async createAddress(personId, addressData) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('=== CRIANDO ENDEREÇO ===', {
        requestId,
        personId,
        addressData
      });

      // Validate and get complete address data from CEP
      if (addressData.postal_code) {
        const { isValid, address, message } = await this.cepService.validateAndGetAddress(addressData.postal_code);
        
        if (!isValid) {
          logger.warn('CEP inválido ou genérico:', {
            requestId,
            message
          });
          throw new Error(message);
        }

        // Merge the validated address data with any provided overrides
        addressData = {
          ...address,
          ...addressData,
          person_id: personId
        };
      }

      // Create the address
      const result = await this.prisma.addresses.create({
        data: {
          person_id: personId,
          street: addressData.street,
          number: addressData.number || '',
          complement: addressData.complement || '',
          neighborhood: addressData.neighborhood || '',
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.postal_code,
          country: 'Brasil',
          reference: addressData.reference || '',
          ibge: addressData.ibge
        }
      });

      logger.info('Endereço criado com sucesso:', {
        requestId,
        address: result
      });

      return result;
    } catch (error) {
      logger.error('Erro ao criar endereço:', {
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  async update(personId, data) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      logger.info('=== INICIANDO ATUALIZAÇÃO DE PESSOA ===', {
        requestId,
        personId,
        dataKeys: Object.keys(data)
      });

      // Separar os dados em suas respectivas entidades
      const {
        addresses,
        cnaes,
        tax_regime,
        qsa,
        ...basicData
      } = data;

      // Remover campos que não existem no modelo
      const allowedFields = [
        'full_name',
        'birth_date',
        'person_type_id',
        'fantasy_name',
        'social_capital'
      ];

      const cleanedData = {};
      Object.keys(basicData).forEach(key => {
        if (allowedFields.includes(key) && basicData[key] !== undefined && basicData[key] !== null) {
          cleanedData[key] = basicData[key];
        }
      });

      return await this.prisma.$transaction(async (prisma) => {
        // 1. Atualizar dados básicos da pessoa
        logger.info('Iniciando atualização dos dados básicos:', {
          requestId,
          personId,
          cleanedData: JSON.stringify(cleanedData)
        });

        const updatedPerson = await prisma.persons.update({
          where: { 
            person_id: parseInt(personId) 
          },
          data: cleanedData,
          include: {
            person_types: true,
            addresses: true,
            person_cnae: {
              include: {
                cnae: true
              }
            },
            person_tax_regimes: {
              include: {
                tax_regimes: true
              }
            }
          }
        });

        // 2. Atualizar CNAEs
        if (Array.isArray(cnaes) && cnaes.length > 0) {
          await prisma.person_cnae.deleteMany({
            where: {
              person_id: parseInt(personId)
            }
          });

          await Promise.all(cnaes.map(cnae => 
            prisma.person_cnae.create({
              data: {
                person_id: parseInt(personId),
                cnae_id: parseInt(cnae.cnae_id),
                is_primary: Boolean(cnae.is_primary)
              }
            })
          ));
        }

        // 3. Atualizar regime tributário
        if (tax_regime) {
          await prisma.person_tax_regimes.deleteMany({
            where: {
              person_id: parseInt(personId)
            }
          });

          await prisma.person_tax_regimes.create({
            data: {
              person_id: parseInt(personId),
              tax_regime_id: parseInt(tax_regime.id)
            }
          });
        }

        // 4. Atualizar endereço
        if (addresses?.[0]) {
          const addressData = addresses[0];
          const allowedAddressFields = [
            'street',
            'number',
            'complement',
            'neighborhood',
            'city',
            'state',
            'postal_code',
            'country',
            'reference',
            'ibge'
          ];

          const cleanedAddressData = {};
          Object.keys(addressData).forEach(key => {
            if (allowedAddressFields.includes(key) && addressData[key] !== undefined && addressData[key] !== null) {
              cleanedAddressData[key] = addressData[key];
            }
          });

          await prisma.addresses.upsert({
            where: {
              person_id: parseInt(personId)
            },
            update: cleanedAddressData,
            create: {
              ...cleanedAddressData,
              person_id: parseInt(personId)
            }
          });
        }

        // 5. Atualizar QSA
        if (Array.isArray(qsa) && qsa.length > 0) {
          await prisma.person_qsa.deleteMany({
            where: {
              juridical_person_id: parseInt(personId)
            }
          });

          await Promise.all(qsa.map(member => 
            prisma.person_qsa.create({
              data: {
                juridical_person_id: parseInt(personId),
                physical_person_id: parseInt(member.person_id),
                participation: member.share_percentage ? parseFloat(member.share_percentage) : null,
                administrator: Boolean(member.administrator)
              }
            })
          ));
        }

        logger.info('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===', {
          requestId,
          personId
        });

        return updatedPerson;
      });
    } catch (error) {
      logger.error('Erro fatal na atualização de pessoa:', {
        requestId,
        error: error.message,
        code: error.code,
        stack: error.stack,
        data: JSON.stringify(data, null, 2)
      });
      throw error;
    }
  }

  async processQSA(prisma, personId, qsaMembers, userLicenses) {
    if (!qsaMembers?.length) return;

    // Remover relações QSA existentes
    await prisma.person_qsa.deleteMany({
      where: { person_id: personId }
    });

    // Processar cada membro do QSA
    for (const member of qsaMembers) {
      let qsaPerson;

      // Buscar se a pessoa do QSA já existe pelo documento (se houver)
      if (member.document_value) {
        qsaPerson = await prisma.persons.findFirst({
          where: {
            person_documents: {
              some: {
                document_value: member.document_value
              }
            }
          }
        });
      }

      // Se não existir, criar uma nova pessoa com os dados básicos
      if (!qsaPerson) {
        qsaPerson = await prisma.persons.create({
          data: {
            full_name: member.full_name,
            person_types: {
              connect: {
                person_type_id: 2 // Assumindo que membros do QSA são pessoas físicas
              }
            },
            ...(member.document_value && {
              person_documents: {
                create: {
                  document_value: member.document_value,
                  document_types: {
                    connect: {
                      type: 'CPF' // Assumindo que o documento é CPF
                    }
                  }
                }
              }
            }),
            // Associar à licença do usuário
            person_license: {
              create: {
                license_id: userLicenses[0]
              }
            }
          }
        });
      }

      // Criar relação no QSA
      await prisma.person_qsa.create({
        data: {
          person_id: personId,
          qsa_person_id: qsaPerson.person_id,
          role: member.role,
          qualification: member.qualification
        }
      });
    }
  }

  async createDocument(documentData) {
    const { document_type_id, document_value } = documentData;
    try {
      const document = await this.prisma.person_documents.upsert({
        where: {
          person_documents_unique_idx: {
            person_id: documentData.person_id,
            document_type_id: parseInt(document_type_id),
            document_value
          }
        },
        update: {},
        create: {
          person_id: documentData.person_id,
          document_type_id: parseInt(document_type_id),
          document_value
        }
      });

      this.logger.info('Documento criado/atualizado com sucesso', {
        document_id: document.person_document_id,
        document_type: document_type_id,
        document_value
      });

      return document;
    } catch (error) {
      this.logger.error('Erro ao criar/atualizar documento', {
        error: error.message,
        documentData
      });
      throw error;
    }
  }

  async findPersonByDocument(document_type_id, document_value) {
    try {
      const document = await this.prisma.person_documents.findFirst({
        where: {
          document_type_id: parseInt(document_type_id),
          document_value
        },
        include: {
          persons: true
        }
      });

      return document?.persons || null;
    } catch (error) {
      this.logger.error('Erro ao buscar pessoa por documento', {
        error: error.message,
        document_type_id,
        document_value
      });
      throw error;
    }
  }

  async createPerson(personData) {
    try {
      const allowedFields = [
        'full_name',
        'birth_date',
        'person_type_id',
        'fantasy_name',
        'social_capital'
      ];

      const cleanedData = {};
      Object.keys(personData).forEach(key => {
        if (allowedFields.includes(key) && personData[key] !== undefined && personData[key] !== null) {
          cleanedData[key] = personData[key];
        }
      });

      const person = await this.prisma.persons.create({
        data: cleanedData
      });

      this.logger.info('Pessoa criada com sucesso', {
        person_id: person.person_id,
        data: cleanedData
      });

      return person;
    } catch (error) {
      this.logger.error('Erro ao criar pessoa', {
        error: error.message,
        personData
      });
      throw error;
    }
  }

  async updateAddress(person_id, addressData) {
    try {
      const allowedFields = [
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'postal_code',
        'country',
        'reference',
        'ibge'
      ];

      const cleanedData = {};
      Object.keys(addressData).forEach(key => {
        if (allowedFields.includes(key) && addressData[key] !== undefined && addressData[key] !== null) {
          cleanedData[key] = addressData[key];
        }
      });

      const address = await this.prisma.addresses.upsert({
        where: {
          person_id: parseInt(person_id)
        },
        update: cleanedData,
        create: {
          ...cleanedData,
          person_id: parseInt(person_id)
        }
      });

      this.logger.info('Endereço atualizado com sucesso', {
        person_id,
        address_id: address.address_id
      });

      return address;
    } catch (error) {
      this.logger.error('Erro ao atualizar endereço', {
        error: error.message,
        person_id,
        addressData
      });
      throw error;
    }
  }

  async updateQSA(person_id, qsaData) {
    try {
      await this.prisma.person_qsa.deleteMany({
        where: {
          juridical_person_id: parseInt(person_id)
        }
      });

      if (Array.isArray(qsaData) && qsaData.length > 0) {
        const qsaRecords = await Promise.all(qsaData.map(member =>
          this.prisma.person_qsa.create({
            data: {
              juridical_person_id: parseInt(person_id),
              physical_person_id: parseInt(member.person_id),
              participation: member.share_percentage ? parseFloat(member.share_percentage) : null,
              administrator: Boolean(member.administrator)
            }
          })
        ));

        this.logger.info('QSA atualizado com sucesso', {
          person_id,
          qsaCount: qsaRecords.length
        });

        return qsaRecords;
      }
      return [];
    } catch (error) {
      this.logger.error('Erro ao atualizar QSA', {
        error: error.message,
        person_id,
        qsaData
      });
      throw error;
    }
  }

  async updateCNAEs(person_id, cnaesData) {
    try {
      await this.prisma.person_cnae.deleteMany({
        where: {
          person_id: parseInt(person_id)
        }
      });

      if (Array.isArray(cnaesData) && cnaesData.length > 0) {
        const cnaeRecords = await Promise.all(cnaesData.map(cnae =>
          this.prisma.person_cnae.create({
            data: {
              person_id: parseInt(person_id),
              cnae_id: parseInt(cnae.cnae_id),
              is_primary: Boolean(cnae.is_primary)
            }
          })
        ));

        this.logger.info('CNAEs atualizados com sucesso', {
          person_id,
          cnaeCount: cnaeRecords.length
        });

        return cnaeRecords;
      }
      return [];
    } catch (error) {
      this.logger.error('Erro ao atualizar CNAEs', {
        error: error.message,
        person_id,
        cnaesData
      });
      throw error;
    }
  }

  async updateTaxRegime(person_id, taxRegimeData) {
    try {
      await this.prisma.person_tax_regimes.deleteMany({
        where: {
          person_id: parseInt(person_id)
        }
      });

      if (taxRegimeData) {
        const taxRegime = await this.prisma.person_tax_regimes.create({
          data: {
            person_id: parseInt(person_id),
            tax_regime_id: parseInt(taxRegimeData.id)
          }
        });

        this.logger.info('Regime tributário atualizado com sucesso', {
          person_id,
          tax_regime_id: taxRegimeData.id
        });

        return taxRegime;
      }
      return null;
    } catch (error) {
      this.logger.error('Erro ao atualizar regime tributário', {
        error: error.message,
        person_id,
        taxRegimeData
      });
      throw error;
    }
  }

  async createCNPJ(data) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      this.logger.info('=== INICIANDO CRIAÇÃO/ATUALIZAÇÃO POR CNPJ ===', {
        requestId,
        cnpj: data.documents?.[0]?.document_value
      });

      // 1. Criar/Atualizar documento
      const document = await this.createDocument(data.documents[0]);
      
      // 2. Buscar pessoa pelo documento
      const existingPerson = await this.findPersonByDocument(
        data.documents[0].document_type_id,
        data.documents[0].document_value
      );

      let person;
      if (existingPerson) {
        // 3a. Atualizar pessoa existente
        person = await this.update(existingPerson.person_id, data);
      } else {
        // 3b. Criar nova pessoa
        person = await this.createPerson(data);
        
        // Atualizar o person_id no documento
        await this.createDocument({
          ...data.documents[0],
          person_id: person.person_id
        });
      }

      // 4. Atualizar dados relacionados
      await Promise.all([
        data.addresses && this.updateAddress(person.person_id, data.addresses[0]),
        data.qsa && this.updateQSA(person.person_id, data.qsa),
        data.cnaes && this.updateCNAEs(person.person_id, data.cnaes),
        data.tax_regime && this.updateTaxRegime(person.person_id, data.tax_regime)
      ]);

      this.logger.info('=== CRIAÇÃO/ATUALIZAÇÃO POR CNPJ CONCLUÍDA ===', {
        requestId,
        person_id: person.person_id
      });

      return person;
    } catch (error) {
      this.logger.error('Erro fatal na criação/atualização por CNPJ:', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async update(personId, data) {
    const requestId = Math.random().toString(36).substring(7);
    try {
      this.logger.info('=== INICIANDO ATUALIZAÇÃO DE PESSOA ===', {
        requestId,
        personId
      });

      const {
        addresses,
        cnaes,
        tax_regime,
        qsa,
        ...basicData
      } = data;

      // 1. Atualizar dados básicos
      const allowedFields = [
        'full_name',
        'birth_date',
        'person_type_id',
        'fantasy_name',
        'social_capital'
      ];

      const cleanedData = {};
      Object.keys(basicData).forEach(key => {
        if (allowedFields.includes(key) && basicData[key] !== undefined && basicData[key] !== null) {
          cleanedData[key] = basicData[key];
        }
      });

      const updatedPerson = await this.prisma.persons.update({
        where: { 
          person_id: parseInt(personId) 
        },
        data: cleanedData
      });

      // 2. Atualizar dados relacionados
      await Promise.all([
        addresses?.[0] && this.updateAddress(personId, addresses[0]),
        qsa && this.updateQSA(personId, qsa),
        cnaes && this.updateCNAEs(personId, cnaes),
        tax_regime && this.updateTaxRegime(personId, tax_regime)
      ]);

      this.logger.info('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===', {
        requestId,
        personId
      });

      return updatedPerson;
    } catch (error) {
      this.logger.error('Erro fatal na atualização de pessoa:', {
        requestId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Método auxiliar para obter os IDs das licenças do usuário
  async getLicenseIdsByUserId(userId) {
    const userLicenses = await this.prisma.user_license.findMany({
      where: { user_id: userId },
      select: { license_id: true }
    });
    return userLicenses.map(ul => ul.license_id);
  }
}

module.exports = PrismaPersonRepository;
