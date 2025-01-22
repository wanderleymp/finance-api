import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Módulo de configuração de banco de dados dinâmico
 * 
 * Suporta PostgreSQL e SQL Server com configuração baseada em variáveis de ambiente
 * 
 * Exemplo de .env:
 * 
 * # Dialeto do banco de dados (postgres ou mssql)
 * DB_DIALECT=postgres
 * 
 * # URLs de conexão
 * DEV_DATABASE_URL=postgresql://user:pass@localhost:5432/devdb
 * SYSTEM_DATABASE_URL=postgresql://user:pass@production-server:5432/proddb
 * 
 * # URLs para MSSQL
 * DEV_MSSQL_DATABASE_URL=mssql://user:pass@localhost:1433/devdb
 * SYSTEM_MSSQL_DATABASE_URL=mssql://user:pass@production-server:1433/proddb
 * 
 * # Configurações adicionais
 * NODE_ENV=development
 * DISABLE_MIGRATIONS=false
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Determinar o dialeto do banco de dados
        const dbDialect = configService.get<string>('DB_DIALECT', 'postgres');
        
        // Determinar ambiente
        const nodeEnv = configService.get<string>('NODE_ENV', 'development');
        const isDevelopment = nodeEnv === 'development';

        // Determinar URL de conexão
        const databaseUrl = isDevelopment 
          ? configService.get<string>(`DEV_${dbDialect.toUpperCase()}_DATABASE_URL`)
          : configService.get<string>('SYSTEM_DATABASE_URL');

        // Verificar migrations
        const disableMigrations = configService.get<string>('DISABLE_MIGRATIONS') === 'true';

        // Configurações base
        const baseConfig = {
          type: dbDialect === 'mssql' ? 'mssql' : 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: isDevelopment,
          logging: isDevelopment,
          migrationsRun: !disableMigrations,
          migrations: ['src/migrations/**/*{.ts,.js}'],
          cli: {
            migrationsDir: 'src/migrations'
          }
        };

        // Configurações específicas por dialeto
        const dialectConfig = dbDialect === 'mssql' 
          ? { 
              options: { 
                encrypt: true,  // Necessário para Azure
                trustServerCertificate: true 
              }
            }
          : { 
              ssl: isDevelopment ? false : { rejectUnauthorized: false } 
            };

        return {
          ...baseConfig,
          ...dialectConfig
        };
      }
    })
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}

/**
 * Exemplo de como importar no AppModule:
 * 
 * @Module({
 *   imports: [
 *     ConfigModule.forRoot(),
 *     DatabaseModule,
 *     // Outros módulos
 *   ],
 *   controllers: [],
 *   providers: [],
 * })
 * export class AppModule {}
 */
