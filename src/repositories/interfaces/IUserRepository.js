/**
 * @interface IUserRepository
 * @description Interface para o repositório de usuários
 */
class IUserRepository {
  async getAllUsers() {
    throw new Error('Method not implemented');
  }

  async getUserById(id) {
    throw new Error('Method not implemented');
  }

  async createUser(userData) {
    throw new Error('Method not implemented');
  }

  async updateUser(id, userData) {
    throw new Error('Method not implemented');
  }

  async deleteUser(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = IUserRepository;
