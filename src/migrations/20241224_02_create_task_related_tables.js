const { logger } = require('../middlewares/logger');

exports.up = async (knex) => {
    try {
        await knex.schema
            // Criar tabela task_types
            .createTable('task_types', (table) => {
                table.increments('type_id').primary();
                table.string('name').notNullable().unique();
                table.string('description');
                table.boolean('active').defaultTo(true);
                table.timestamps(true, true);
            })
            // Criar tabela task_dependencies
            .createTable('task_dependencies', (table) => {
                table.increments('dependency_id').primary();
                table.integer('task_id').notNullable()
                    .references('task_id').inTable('tasks')
                    .onDelete('CASCADE');
                table.integer('dependency_id').notNullable()
                    .references('task_id').inTable('tasks')
                    .onDelete('CASCADE');
                table.timestamps(true, true);
                // Índices
                table.unique(['task_id', 'dependency_id']);
                table.index('task_id');
                table.index('dependency_id');
            })
            // Criar tabela task_logs
            .createTable('task_logs', (table) => {
                table.increments('log_id').primary();
                table.integer('task_id').notNullable()
                    .references('task_id').inTable('tasks')
                    .onDelete('CASCADE');
                table.string('status').notNullable();
                table.integer('execution_time');
                table.text('error_message');
                table.jsonb('metadata');
                table.integer('retries').defaultTo(0);
                table.timestamps(true, true);
                // Índices
                table.index('task_id');
                table.index('status');
                table.index('created_at');
            })
            // Alterar tabela tasks
            .alterTable('tasks', (table) => {
                // Novos campos
                table.string('name').notNullable();
                table.integer('type_id')
                    .references('type_id').inTable('task_types')
                    .onDelete('RESTRICT');
                table.string('description');
                table.string('status').notNullable().defaultTo('pending');
                table.integer('priority').defaultTo(0);
                table.timestamp('scheduled_for');
                table.integer('max_retries').defaultTo(3);
                // Índices
                table.index('type_id');
                table.index('status');
                table.index('priority');
                table.index('scheduled_for');
            });

        // Inserir tipos de task padrão
        await knex('task_types').insert([
            {
                name: 'generic',
                description: 'Tarefa genérica',
                active: true
            },
            {
                name: 'import',
                description: 'Importação de dados',
                active: true
            },
            {
                name: 'export',
                description: 'Exportação de dados',
                active: true
            },
            {
                name: 'process',
                description: 'Processamento de dados',
                active: true
            },
            {
                name: 'notification',
                description: 'Envio de notificações',
                active: true
            }
        ]);

        logger.info('Migração concluída com sucesso');
    } catch (error) {
        logger.error('Erro na migração', { error });
        throw error;
    }
};

exports.down = async (knex) => {
    try {
        await knex.schema
            // Remover campos da tabela tasks
            .alterTable('tasks', (table) => {
                table.dropColumn('name');
                table.dropColumn('type_id');
                table.dropColumn('description');
                table.dropColumn('status');
                table.dropColumn('priority');
                table.dropColumn('scheduled_for');
                table.dropColumn('max_retries');
            })
            // Remover tabelas na ordem correta
            .dropTableIfExists('task_logs')
            .dropTableIfExists('task_dependencies')
            .dropTableIfExists('task_types');

        logger.info('Rollback concluído com sucesso');
    } catch (error) {
        logger.error('Erro no rollback', { error });
        throw error;
    }
};
