const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Finance API',
            version: '1.0.0',
            description: 'API para gerenciamento financeiro'
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Mensagem de erro'
                        }
                    }
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        total: {
                            type: 'integer',
                            description: 'Total de registros'
                        },
                        totalPages: {
                            type: 'integer',
                            description: 'Total de páginas'
                        },
                        page: {
                            type: 'integer',
                            description: 'Página atual'
                        },
                        limit: {
                            type: 'integer',
                            description: 'Limite de registros por página'
                        }
                    }
                },
                Item: {
                    type: 'object',
                    properties: {
                        item_id: {
                            type: 'integer',
                            description: 'ID do item'
                        },
                        code: {
                            type: 'string',
                            description: 'Código do item'
                        },
                        name: {
                            type: 'string',
                            description: 'Nome do item'
                        },
                        description: {
                            type: 'string',
                            description: 'Descrição do item'
                        },
                        price: {
                            type: 'number',
                            description: 'Preço do item'
                        },
                        active: {
                            type: 'boolean',
                            description: 'Status do item'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de criação'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de atualização'
                        }
                    }
                },
                Person: {
                    type: 'object',
                    properties: {
                        person_id: {
                            type: 'integer',
                            description: 'ID da pessoa'
                        },
                        name: {
                            type: 'string',
                            description: 'Nome da pessoa'
                        },
                        document: {
                            type: 'string',
                            description: 'Documento (CPF/CNPJ)'
                        },
                        type: {
                            type: 'string',
                            enum: ['PF', 'PJ'],
                            description: 'Tipo de pessoa'
                        },
                        active: {
                            type: 'boolean',
                            description: 'Status da pessoa'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de criação'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data de atualização'
                        }
                    }
                },
                Movement: {
                    type: 'object',
                    properties: {
                        movement_id: {
                            type: 'integer',
                            description: 'ID único do movimento'
                        },
                        person_id: {
                            type: 'integer',
                            description: 'ID da pessoa associada ao movimento'
                        },
                        person_name: {
                            type: 'string',
                            description: 'Nome da pessoa associada ao movimento'
                        },
                        movement_type_id: {
                            type: 'integer',
                            description: 'ID do tipo de movimento'
                        },
                        movement_type_name: {
                            type: 'string',
                            description: 'Nome do tipo de movimento',
                            enum: ['INCOME', 'EXPENSE']
                        },
                        movement_status_id: {
                            type: 'integer',
                            description: 'ID do status do movimento'
                        },
                        movement_status_name: {
                            type: 'string',
                            description: 'Nome do status do movimento',
                            enum: ['PENDING', 'PAID', 'CANCELLED']
                        },
                        description: {
                            type: 'string',
                            description: 'Descrição detalhada do movimento'
                        },
                        movement_date: {
                            type: 'string',
                            format: 'date',
                            description: 'Data do movimento'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data e hora de criação do movimento'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Data e hora da última atualização'
                        },
                        total_amount: {
                            type: 'number',
                            description: 'Valor total do movimento'
                        },
                        payments: {
                            type: 'array',
                            description: 'Lista de pagamentos associados ao movimento',
                            items: {
                                type: 'object',
                                properties: {
                                    payment_id: {
                                        type: 'integer',
                                        description: 'ID do pagamento'
                                    },
                                    movement_id: {
                                        type: 'integer',
                                        description: 'ID do movimento associado'
                                    },
                                    payment_type: {
                                        type: 'string',
                                        description: 'Tipo de pagamento'
                                    },
                                    total_amount: {
                                        type: 'number',
                                        description: 'Valor total do pagamento'
                                    },
                                    installments_number: {
                                        type: 'integer',
                                        description: 'Número de parcelas'
                                    },
                                    created_at: {
                                        type: 'string',
                                        format: 'date-time',
                                        description: 'Data de criação do pagamento'
                                    },
                                    installments: {
                                        type: 'array',
                                        description: 'Lista de parcelas do pagamento',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                installment_id: {
                                                    type: 'integer',
                                                    description: 'ID da parcela'
                                                },
                                                payment_id: {
                                                    type: 'integer',
                                                    description: 'ID do pagamento associado'
                                                },
                                                due_date: {
                                                    type: 'string',
                                                    format: 'date',
                                                    description: 'Data de vencimento da parcela'
                                                },
                                                amount: {
                                                    type: 'number',
                                                    description: 'Valor da parcela'
                                                },
                                                status: {
                                                    type: 'string',
                                                    description: 'Status da parcela',
                                                    enum: ['PENDING', 'PAID', 'OVERDUE']
                                                },
                                                installment_number: {
                                                    type: 'integer',
                                                    description: 'Número da parcela'
                                                },
                                                boletos: {
                                                    type: 'array',
                                                    description: 'Lista de boletos associados à parcela',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            boleto_id: {
                                                                type: 'integer',
                                                                description: 'ID do boleto'
                                                            },
                                                            status: {
                                                                type: 'string',
                                                                description: 'Status do boleto'
                                                            },
                                                            generated_at: {
                                                                type: 'string',
                                                                format: 'date-time',
                                                                description: 'Data de geração do boleto'
                                                            },
                                                            boleto_number: {
                                                                type: 'string',
                                                                description: 'Número do boleto'
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        paths: {
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: {
                                            type: 'string',
                                            format: 'email'
                                        },
                                        password: {
                                            type: 'string',
                                            format: 'password'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Login realizado com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: {
                                                type: 'string'
                                            },
                                            refreshToken: {
                                                type: 'string'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/auth/refresh': {
                post: {
                    tags: ['Auth'],
                    summary: 'Atualiza token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['refreshToken'],
                                    properties: {
                                        refreshToken: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Token atualizado com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            token: {
                                                type: 'string'
                                            },
                                            refreshToken: {
                                                type: 'string'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/auth/logout': {
                post: {
                    tags: ['Auth'],
                    summary: 'Logout',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Logout realizado com sucesso'
                        }
                    }
                }
            },
            '/health': {
                get: {
                    tags: ['Health'],
                    summary: 'Status da API',
                    responses: {
                        200: {
                            description: 'API funcionando normalmente',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                enum: ['ok']
                                            },
                                            timestamp: {
                                                type: 'string',
                                                format: 'date-time'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/health/cache/clear': {
                post: {
                    tags: ['Health'],
                    summary: 'Limpa todo o cache',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Cache limpo com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                enum: ['success']
                                            },
                                            message: {
                                                type: 'string'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/persons': {
                get: {
                    tags: ['Persons'],
                    summary: 'Lista todas as pessoas',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            schema: {
                                type: 'integer',
                                default: 1
                            },
                            description: 'Página'
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: {
                                type: 'integer',
                                default: 10
                            },
                            description: 'Limite por página'
                        },
                        {
                            in: 'query',
                            name: 'search',
                            schema: {
                                type: 'string'
                            },
                            description: 'Busca por nome ou documento'
                        },
                        {
                            in: 'query',
                            name: 'type',
                            schema: {
                                type: 'string',
                                enum: ['PF', 'PJ']
                            },
                            description: 'Tipo de pessoa'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de pessoas',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/Person'
                                                }
                                            },
                                            pagination: {
                                                $ref: '#/components/schemas/Pagination'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Persons'],
                    summary: 'Cria uma nova pessoa',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'type', 'document'],
                                    properties: {
                                        name: {
                                            type: 'string'
                                        },
                                        type: {
                                            type: 'string',
                                            enum: ['PF', 'PJ']
                                        },
                                        document: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Pessoa criada com sucesso'
                        }
                    }
                }
            },
            '/persons/{id}': {
                get: {
                    tags: ['Persons'],
                    summary: 'Busca uma pessoa por ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Pessoa encontrada'
                        }
                    }
                },
                put: {
                    tags: ['Persons'],
                    summary: 'Atualiza uma pessoa',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: {
                                            type: 'string'
                                        },
                                        document: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Pessoa atualizada com sucesso'
                        }
                    }
                },
                delete: {
                    tags: ['Persons'],
                    summary: 'Remove uma pessoa',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Pessoa removida com sucesso'
                        }
                    }
                }
            },
            '/persons/{id}/details': {
                get: {
                    tags: ['Persons'],
                    summary: 'Busca uma pessoa por ID com detalhes',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Pessoa encontrada com detalhes'
                        }
                    }
                }
            },
            '/persons/{id}/documents': {
                get: {
                    tags: ['Persons'],
                    summary: 'Lista documentos de uma pessoa',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de documentos'
                        }
                    }
                }
            },
            '/persons/{id}/contacts': {
                get: {
                    tags: ['Persons'],
                    summary: 'Lista contatos de uma pessoa',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de contatos'
                        }
                    }
                }
            },
            '/persons/{id}/addresses': {
                get: {
                    tags: ['Persons'],
                    summary: 'Lista endereços de uma pessoa',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de endereços'
                        }
                    }
                }
            },
            '/persons/cnpj': {
                post: {
                    tags: ['Persons'],
                    summary: 'Cria/atualiza pessoa por CNPJ',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['cnpj'],
                                    properties: {
                                        cnpj: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Pessoa criada/atualizada com sucesso'
                        }
                    }
                }
            },
            '/items': {
                get: {
                    tags: ['Items'],
                    summary: 'Lista todos os items',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            schema: {
                                type: 'integer',
                                default: 1
                            },
                            description: 'Página'
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: {
                                type: 'integer',
                                default: 10
                            },
                            description: 'Limite por página'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de items',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/Item'
                                                }
                                            },
                                            pagination: {
                                                $ref: '#/components/schemas/Pagination'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    tags: ['Items'],
                    summary: 'Cria um novo item',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['code', 'name', 'price'],
                                    properties: {
                                        code: {
                                            type: 'string'
                                        },
                                        name: {
                                            type: 'string'
                                        },
                                        description: {
                                            type: 'string'
                                        },
                                        price: {
                                            type: 'number'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: {
                            description: 'Item criado com sucesso'
                        }
                    }
                }
            },
            '/items/{id}': {
                get: {
                    tags: ['Items'],
                    summary: 'Busca um item por ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Item encontrado'
                        }
                    }
                },
                put: {
                    tags: ['Items'],
                    summary: 'Atualiza um item',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        code: {
                                            type: 'string'
                                        },
                                        name: {
                                            type: 'string'
                                        },
                                        description: {
                                            type: 'string'
                                        },
                                        price: {
                                            type: 'number'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: {
                            description: 'Item atualizado com sucesso'
                        }
                    }
                },
                delete: {
                    tags: ['Items'],
                    summary: 'Remove um item',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            }
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Item removido com sucesso'
                        }
                    }
                }
            },
            '/installments/{id}/due-date': {
                patch: {
                    summary: 'Atualizar data de vencimento de uma parcela',
                    description: 'Atualiza a data de vencimento de uma parcela específica',
                    tags: ['Installments'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'ID da parcela',
                            schema: {
                                type: 'integer',
                                minimum: 1
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        due_date: {
                                            type: 'string',
                                            format: 'date-time',
                                            description: 'Nova data de vencimento no formato ISO'
                                        }
                                    },
                                    required: ['due_date']
                                },
                                example: {
                                    due_date: '2025-02-15T00:00:00Z'
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Parcela atualizada com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {
                                                type: 'boolean',
                                                example: true
                                            },
                                            data: {
                                                $ref: '#/components/schemas/Installment'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Erro de validação',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ValidationError'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Não autorizado',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/UnauthorizedError'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Parcela não encontrada',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/NotFoundError'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/movements': {
                get: {
                    tags: ['Movimentos'],
                    summary: 'Listar movimentos',
                    description: 'Recupera uma lista de movimentos com suporte a paginação e inclusão de dados relacionados',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            schema: {
                                type: 'integer',
                                default: 1,
                                minimum: 1
                            },
                            description: 'Número da página de resultados'
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: {
                                type: 'integer',
                                default: 10,
                                minimum: 1,
                                maximum: 100
                            },
                            description: 'Quantidade de registros por página'
                        },
                        {
                            in: 'query',
                            name: 'include',
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['payments', 'installments', 'boletos', 'person']
                                }
                            },
                            description: 'Dados relacionados a serem incluídos na resposta. Opções: payments (pagamentos), installments (parcelas), boletos (boletos bancários), person (dados da pessoa)',
                            style: 'form',
                            explode: false
                        },
                        {
                            in: 'query',
                            name: 'type',
                            schema: {
                                type: 'string',
                                enum: ['INCOME', 'EXPENSE']
                            },
                            description: 'Filtrar movimentos por tipo (Receita ou Despesa)'
                        },
                        {
                            in: 'query',
                            name: 'status',
                            schema: {
                                type: 'string',
                                enum: ['PENDING', 'PAID', 'CANCELLED']
                            },
                            description: 'Filtrar movimentos por status'
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Lista de movimentos recuperada com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/Movement'
                                                }
                                            },
                                            pagination: {
                                                $ref: '#/components/schemas/Pagination'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        400: {
                            description: 'Requisição inválida',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Não autorizado. Token de autenticação inválido ou ausente',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/movements/{id}': {
                get: {
                    tags: ['Movimentos'],
                    summary: 'Buscar movimento por ID',
                    description: 'Recupera os detalhes de um movimento específico, com opção de incluir dados relacionados',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1
                            },
                            description: 'ID único do movimento'
                        },
                        {
                            in: 'query',
                            name: 'include',
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['payments', 'installments', 'boletos', 'person']
                                }
                            },
                            description: 'Dados relacionados a serem incluídos na resposta. Opções: payments (pagamentos), installments (parcelas), boletos (boletos bancários), person (dados da pessoa)',
                            style: 'form',
                            explode: false
                        }
                    ],
                    responses: {
                        200: {
                            description: 'Movimento encontrado com sucesso',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Movement'
                                    }
                                }
                            }
                        },
                        404: {
                            description: 'Movimento não encontrado',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        401: {
                            description: 'Não autorizado. Token de autenticação inválido ou ausente',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/modules/*/*.routes.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
