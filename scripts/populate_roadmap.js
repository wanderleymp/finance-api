const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DEV_DATABASE_URL.replace(/\?.*$/, ''),
  ssl: false
});

const roadmapTasks = [
  {
    title: 'Definir Escopo do Projeto',
    description: 'Realizar reunião inicial para definir o escopo completo do projeto de API financeira',
    status: 'pendente'
  },
  {
    title: 'Configurar Ambiente de Desenvolvimento',
    description: 'Preparar ambiente de desenvolvimento com Node.js, Express e PostgreSQL',
    status: 'em progresso'
  },
  {
    title: 'Implementar Camada de Repositório',
    description: 'Criar classes de repositório para acesso a dados de diferentes entidades financeiras',
    status: 'pendente'
  },
  {
    title: 'Desenvolver Autenticação JWT',
    description: 'Implementar sistema de autenticação com tokens JWT para segurança da API',
    status: 'pendente'
  },
  {
    title: 'Criar Testes Unitários',
    description: 'Desenvolver testes unitários para serviços e repositórios da aplicação',
    status: 'pendente'
  }
];

async function clearAndPopulateRoadmap() {
  const client = await pool.connect();

  try {
    // Iniciar transação
    await client.query('BEGIN');

    // Limpar tabela existente
    await client.query('DELETE FROM roadmap');

    // Resetar sequência do ID
    await client.query('ALTER SEQUENCE roadmap_id_seq RESTART WITH 1');

    // Inserir novas tarefas
    for (const task of roadmapTasks) {
      await client.query(
        `INSERT INTO roadmap (title, description, status, started_at, created_at, updated_at) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [task.title, task.description, task.status]
      );
    }

    // Commitar transação
    await client.query('COMMIT');

    console.log('Roadmap populado com sucesso!');
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao popular roadmap:', error);
  } finally {
    client.release();
  }
}

clearAndPopulateRoadmap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
