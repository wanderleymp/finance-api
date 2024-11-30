const { PrismaClient } = require('@prisma/client');
const IUserRepository = require('../interfaces/IUserRepository');
const logger = require('../../../config/logger');

class PrismaUserRepository extends IUserRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  async getAllUsers(where = {}, skip = 0, take = 10) {
    try {
      const users = await this.prisma.user_accounts.findMany({
        where,
        skip,
        take,
        orderBy: { username: 'asc' },
        include: {
          persons: {
            select: {
              full_name: true,
              person_id: true
            }
          },
          profiles: {
            select: {
              profile_id: true,
              profile_name: true,
              description: true
            }
          },
          user_license: {
            include: {
              licenses: true
            }
          }
        }
      });

      return users.map(user => ({
        user_id: user.user_id,
        username: user.username,
        person_id: user.person_id,
        profile_id: user.profile_id,
        full_name: user.persons?.full_name,
        profile: user.profiles ? {
          id: user.profiles.profile_id,
          name: user.profiles.profile_name,
          description: user.profiles.description
        } : null,
        licenses: user.user_license.map(ul => ({
          id: ul.licenses.license_id,
          name: ul.licenses.license_name,
          description: ul.licenses.description
        }))
      }));
    } catch (error) {
      logger.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  async countUsers(where = {}) {
    try {
      return await this.prisma.user_accounts.count({ where });
    } catch (error) {
      logger.error('Erro ao contar usuários', {
        operation: 'countUsers',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getUserById(id) {
    const startTime = Date.now();
    try {
      logger.info('Iniciando busca de usuário por ID', {
        operation: 'getUserById',
        data: { id }
      });

      const user = await this.prisma.user_accounts.findUnique({
        where: { user_id: parseInt(id) },
        include: {
          persons: {
            select: {
              full_name: true,
              person_id: true
            }
          },
          profiles: {
            select: {
              profile_id: true,
              profile_name: true,
              description: true
            }
          },
          user_license: {
            include: {
              licenses: true
            }
          }
        }
      });

      if (user) {
        // Formata o usuário no mesmo padrão do getAllUsers
        const formattedUser = {
          user_id: user.user_id,
          username: user.username,
          person_id: user.person_id,
          profile_id: user.profile_id,
          full_name: user.persons?.full_name,
          licenses: user.user_license?.map(ul => ({
            id: ul.licenses.license_id,
            name: ul.licenses.license_name,
            description: ul.licenses.description
          })) || []
        };

        const duration = Date.now() - startTime;
        logger.info('Busca de usuário por ID concluída', {
          operation: 'getUserById',
          duration,
          data: { id, found: true }
        });

        return formattedUser;
      }

      const duration = Date.now() - startTime;
      logger.info('Busca de usuário por ID concluída', {
        operation: 'getUserById',
        duration,
        data: { id, found: false }
      });

      return null;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Erro ao buscar usuário por ID', {
        operation: 'getUserById',
        duration,
        error: error.message,
        data: { id }
      });
      throw error;
    }
  }

  async findByIdentifier(identifier) {
    try {
      console.log('=== BUSCA DE USUÁRIO ===');
      console.log('Buscando por:', identifier);

      const user = await this.prisma.user_accounts.findFirst({
        where: {
          OR: [
            { username: identifier },
            {
              persons: {
                OR: [
                  { full_name: { equals: identifier, mode: 'insensitive' } },
                  {
                    person_contacts: {
                      some: {
                        contacts: {
                          is: {
                            contact_value: {
                              equals: identifier,
                              mode: 'insensitive'
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          ]
        },
        select: {
          user_id: true,
          username: true,
          password: true,
          person_id: true,
          profile_id: true,
          persons: {
            include: {
              person_contacts: {
                include: {
                  contacts: {
                    include: {
                      contact_types: true
                    }
                  }
                }
              }
            }
          },
          profiles: {
            select: {
              profile_id: true,
              profile_name: true,
              description: true
            }
          }
        }
      });

      if (user) {
        // Formata o usuário antes de retornar
        const formattedUser = {
          user_id: user.user_id,
          username: user.username,
          password: user.password,
          person_id: user.person_id,
          profile_id: user.profile_id,
          full_name: user.persons?.full_name,
          profile: user.profiles ? {
            id: user.profiles.profile_id,
            name: user.profiles.profile_name,
            description: user.profiles.description
          } : null
        };

        return formattedUser;
      }

      return null;
    } catch (error) {
      console.log('Erro na busca:', error);
      throw new Error(error.message);
    }
  }

  formatUser(user) {
    return {
      user_id: user.user_id,
      username: user.username,
      person_id: user.persons?.person_id,
      profile_id: user.profiles?.profile_id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      licenses: user.user_licenses?.map(ul => ({
        id: ul.licenses.license_id,
        name: ul.licenses.license_name,
        description: ul.licenses.description
      })) || [],
      person: user.persons ? {
        full_name: user.persons.full_name
      } : null,
      profile: user.profiles ? {
        id: user.profiles.profile_id,
        name: user.profiles.profile_name,
        description: user.profiles.description
      } : null
    };
  }
}

module.exports = PrismaUserRepository;