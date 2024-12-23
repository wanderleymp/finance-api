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
            }
        }
    },
    apis: ['./src/routes/*.js', './src/modules/*/*.routes.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
