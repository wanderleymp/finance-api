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
          name: ul.licenses.license_name
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
        console.log('Resultado da busca:', { 
          encontrado: true,
          id: user.user_id,
          username: user.username,
          temSenha: !!user.password,
          hashDaSenha: user.password?.substring(0, 10) + '...'
        });
        return user;
      }

      console.log('Usuário não encontrado');
      return null;
    } catch (error) {
      console.log('Erro na busca:', error);
      throw error;
    }
  }

  async findUserAccountById(userId) {
    try {
      console.log('=== DEBUG findUserAccountById ===');
      console.log('Received User ID:', userId);
      console.log('User ID Type:', typeof userId);
      
      const parsedUserId = parseInt(userId, 10);
      console.log('Parsed User ID:', parsedUserId);
      console.log('Parsed ID Type:', typeof parsedUserId);
      
      const userAccount = await this.prisma.user_accounts.findUnique({
        where: { user_id: parsedUserId },
        select: {
          user_id: true,
          username: true,
          active: true,
          created_at: true,
          updated_at: true,
          profile_id: true
        }
      });

      console.log('User Account Query Result:', userAccount);
      
      return userAccount;
    } catch (error) {
      console.error('=== FULL ERROR IN findUserAccountById ===');
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      
      throw error;
    }
  }

  formatUser(user) {
    console.log('DEBUG formatUser - User Object:', JSON.stringify(user, null, 2));
    
    const formattedUser = {
      user_id: user.user_id,
      username: user.username,
      person_id: user.persons?.person_id,
      full_name: user.persons?.full_name,
      profile_name: user.profiles?.profile_name
    };

    console.log('DEBUG formatUser - Formatted User:', JSON.stringify(formattedUser, null, 2));
    
    return formattedUser;
  }
}

module.exports = PrismaUserRepository;
