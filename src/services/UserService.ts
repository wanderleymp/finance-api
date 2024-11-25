class UserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    return this.userRepository.create(data);
  }

  // outros métodos do serviço...
}

export default UserService;
