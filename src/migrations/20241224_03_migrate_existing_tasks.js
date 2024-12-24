const { logger } = require('../middlewares/logger');

exports.up = async (knex) => {
    try {
        // Buscar o ID do tipo genérico
        const [genericType] = await knex('task_types')
            .where({ name: 'generic' })
            .select('type_id');

        if (!genericType) {
            throw new Error('Tipo genérico não encontrado');
        }

        // Atualizar tasks existentes
        await knex('tasks')
            .update({
                name: knex.raw("COALESCE(name, 'Task ' || task_id)"),
                type_id: genericType.type_id,
                status: knex.raw("COALESCE(status, 'pending')"),
                priority: knex.raw('COALESCE(priority, 0)'),
                max_retries: knex.raw('COALESCE(max_retries, 3)')
            });

        // Criar logs para as tasks existentes
        await knex.raw(`
            INSERT INTO task_logs (task_id, status, created_at, updated_at)
            SELECT 
                task_id,
                status,
                created_at,
                updated_at
            FROM tasks
        `);

        logger.info('Migração de dados concluída com sucesso');
    } catch (error) {
        logger.error('Erro na migração de dados', { error });
        throw error;
    }
};

exports.down = async (knex) => {
    try {
        // Remover logs criados
        await knex('task_logs').delete();

        // Resetar campos das tasks
        await knex('tasks')
            .update({
                name: null,
                type_id: null,
                description: null,
                status: null,
                priority: null,
                scheduled_for: null,
                max_retries: null
            });

        logger.info('Rollback de dados concluído com sucesso');
    } catch (error) {
        logger.error('Erro no rollback de dados', { error });
        throw error;
    }
};
