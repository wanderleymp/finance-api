import { UserLicense, Prisma } from '@prisma/client';
import { UserLicenseRepository } from '../repositories/userLicenseRepository';
import { UserRepository } from '../repositories/userRepository';
import { LicenseRepository } from '../repositories/licenseRepository';
import { BadRequestError } from '../errors/badRequestError';
export class UserLicenseService {
    private userLicenseRepository: UserLicenseRepository;
    private userRepository: UserRepository;
    private licenseRepository: LicenseRepository;
    constructor() {
        this.userLicenseRepository = new UserLicenseRepository();
        this.userRepository = new UserRepository();
        this.licenseRepository = new LicenseRepository();
    }
    async assignLicenseToUser(data: Prisma.UserLicenseCreateInput): Promise<UserLicense> {
        // Validar se o usuário existe
        const user = await this.userRepository.findById(data.user);
        if (!user) {
            throw new BadRequestError("Usu\u00E1rio n\u00E3o encontrado");
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.license);
        if (!license) {
            throw new BadRequestError("Licen\u00E7a n\u00E3o encontrada");
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.userLicenseRepository.findByUserAndLicense(data.user, data.license);
        if (existingAssociation) {
            throw new BadRequestError("Usu\u00E1rio j\u00E1 possui esta licen\u00E7a");
        }
        return this.userLicenseRepository.create(data);
    }
    async getUserLicenseById(id: string): Promise<UserLicense | null> {
        const userLicense = await this.userLicenseRepository.findById(id);
        if (!userLicense) {
            throw new BadRequestError("Associa\u00E7\u00E3o de usu\u00E1rio e licen\u00E7a n\u00E3o encontrada");
        }
        return userLicense;
    }
    async getAllUserLicenses(params?: {
        skip?: number;
        take?: number;
        cursor?: Prisma.UserLicenseWhereUniqueInput;
        where?: Prisma.UserLicenseWhereInput;
        orderBy?: Prisma.UserLicenseOrderByWithRelationInput;
    }): Promise<UserLicense[]> {
        return this.userLicenseRepository.findAll(params);
    }
    async updateUserLicense(id: string, data: Prisma.UserLicenseUpdateInput): Promise<UserLicense> {
        // Verificar se a associação existe
        await this.getUserLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.user) {
            const user = await this.userRepository.findById(data.user as string);
            if (!user) {
                throw new BadRequestError("Usu\u00E1rio n\u00E3o encontrado");
            }
        }
        if (data.license) {
            const license = await this.licenseRepository.findById(data.license as string);
            if (!license) {
                throw new BadRequestError("Licen\u00E7a n\u00E3o encontrada");
            }
        }
        return this.userLicenseRepository.update(id, data);
    }
    async removeUserLicense(id: string): Promise<UserLicense> {
        // Verificar se a associação existe
        await this.getUserLicenseById(id);
        return this.userLicenseRepository.delete(id);
    }
}
