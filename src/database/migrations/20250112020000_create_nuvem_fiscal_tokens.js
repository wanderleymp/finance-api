exports.up = async (knex) => {
  await knex.schema.createTableIfNotExists('nuvem_fiscal_tokens', (table) => {
    table.increments('token_id').primary();
    table.string('access_token').notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('environment').defaultTo('HOMOLOGACAO');
    table.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('nuvem_fiscal_tokens');
};
