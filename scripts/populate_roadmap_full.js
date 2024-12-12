const roadmapService = require('../src/services/roadmapService');
const { logger } = require('../src/middlewares/logger');

const roadmapTasks = [
  // 1. Configuração Inicial
  {
    title: 'Estrutura de Pastas e Arquivos',
    description: 'Configuração inicial do projeto e criação de arquivos essenciais (package.json, .env, README.md).',
    status: 'pendente'
  },
  {
    title: 'Configuração do Git',
    description: 'Configuração do controle de versão e integração com o GitHub.',
    status: 'pendente'
  },
  {
    title: 'Conexão com Banco de Dados',
    description: 'Configuração inicial do PostgreSQL usando strings de conexão do .env.',
    status: 'pendente'
  },

  // 2. Arquitetura do Projeto
  {
    title: 'Criação da Camada de Configuração',
    description: 'Centralizar strings de conexão e variáveis de ambiente.',
    status: 'pendente'
  },
  {
    title: 'Camada de Repositórios',
    description: 'Criar repositórios para acesso ao banco de dados.',
    status: 'pendente'
  },
  {
    title: 'Camada de Serviços',
    description: 'Implementar regras de negócio.',
    status: 'pendente'
  },
  {
    title: 'Camada de Controladores',
    description: 'Controladores de rotas RESTful.',
    status: 'pendente'
  },
  {
    title: 'Definição de Rotas',
    description: 'Configuração inicial das rotas RESTful.',
    status: 'pendente'
  },

  // 3. Recursos Principais
  // 3.1 Tarefas e Registro de Desenvolvimento
  {
    title: 'Tabela Roadmap',
    description: 'Criar estrutura no banco para armazenar tarefas.',
    status: 'pendente'
  },
  {
    title: 'Registro Automático de Tarefas',
    description: 'Atualizar status das tarefas automaticamente.',
    status: 'pendente'
  },

  // 3.2 Logs e Monitoramento
  {
    title: 'Logs de Requisições',
    description: 'Configurar Morgan e Winston para log de requisições HTTP.',
    status: 'pendente'
  },
  {
    title: 'Logs de Erros',
    description: 'Registrar erros de API e operações em arquivos de log.',
    status: 'pendente'
  },
  {
    title: 'Captura de Exceções',
    description: 'Configurar logs de erros não tratados e exceções globais.',
    status: 'pendente'
  },

  // 3.3 Processos Assíncronos
  {
    title: 'Configuração do RabbitMQ',
    description: 'Configurar filas e consumidores para processamento assíncrono.',
    status: 'pendente'
  },
  {
    title: 'Mensagens de Tarefas',
    description: 'Configurar envio e processamento de mensagens assíncronas.',
    status: 'pendente'
  },

  // 4. Segurança e Autenticação
  {
    title: 'JWT Autenticação',
    description: 'Configuração de tokens JWT para autenticação de usuários.',
    status: 'pendente'
  },
  {
    title: 'Proteção de Rotas',
    description: 'Aplicar middleware de autenticação em rotas protegidas.',
    status: 'pendente'
  },
  {
    title: 'Políticas de CORS',
    description: 'Configurar políticas de segurança CORS para controle de acesso.',
    status: 'pendente'
  },

  // 5. Testes e Implementação
  {
    title: 'Testes de Integração',
    description: 'Criar testes para rotas e controladores usando Jest.',
    status: 'pendente'
  },
  {
    title: 'Testes de Unidade',
    description: 'Cobrir funções principais com testes unitários.',
    status: 'pendente'
  },
  {
    title: 'Testes de Regressão',
    description: 'Simular casos de falha e realizar análise de desempenho.',
    status: 'pendente'
  },

  // 6. Deploy e Configuração de Produção
  {
    title: 'Configuração de Produção',
    description: 'Configurar ambientes de produção usando Docker.',
    status: 'pendente'
  },
  {
    title: 'Deploy Automático',
    description: 'Configurar integração contínua no GitHub Actions.',
    status: 'pendente'
  },
  {
    title: 'Monitoramento e Logs de Produção',
    description: 'Configurar integração com ferramentas de monitoramento.',
    status: 'pendente'
  }
];

async function populateRoadmap() {
  try {
    for (const task of roadmapTasks) {
      await roadmapService.createTask(task.title, task.description, task.status);
      logger.info(`Tarefa criada no roadmap: ${task.title}`);
    }
    logger.info('🚀 Roadmap completo registrado com sucesso!');
  } catch (error) {
    logger.error('Erro ao popular roadmap', { 
      error: error.message 
    });
  }
}

populateRoadmap();

module.exports = { populateRoadmap };
