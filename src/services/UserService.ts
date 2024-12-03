class UserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    return this.userRepository.create(data);
  }

  async findUserAccountById(id: number): Promise<UserAccount | null> {
    return this.userRepository.findUserAccountById(id);
  }

  // outros métodos do serviço...
}

export default UserService;
