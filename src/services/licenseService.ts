import { License, Prisma } from '@prisma/client';
import { LicenseRepository } from '../repositories/licenseRepository';
import { PersonRepository } from '../repositories/personRepository';
import { BadRequestError } from '../errors/badRequestError';
export class LicenseService {
    private licenseRepository: LicenseRepository;
    private personRepository: PersonRepository;
    constructor() {
        this.licenseRepository = new LicenseRepository();
        this.personRepository = new PersonRepository();
    }
    async createLicense(data: Prisma.LicenseCreateInput): Promise<License> {
        // Validar se o proprietário da licença existe
        const owner = await this.personRepository.findById(data.person);
        if (!owner) {
            throw new BadRequestError("Pessoa propriet\u00E1ria da licen\u00E7a n\u00E3o encontrada");
        }
        // Validações adicionais podem ser adicionadas aqui
        if (!data.name || data.name.trim() === "") {
            throw new BadRequestError("Nome da licen\u00E7a \u00E9 obrigat\u00F3rio");
        }
        return this.licenseRepository.create(data);
    }
    async getLicenseById(id: string): Promise<License | null> {
        const license = await this.licenseRepository.findById(id);
        if (!license) {
            throw new BadRequestError("Licen\u00E7a n\u00E3o encontrada");
        }
        return license;
    }
    async getAllLicenses(params?: {
        skip?: number;
        take?: number;
        cursor?: Prisma.LicenseWhereUniqueInput;
        where?: Prisma.LicenseWhereInput;
        orderBy?: Prisma.LicenseOrderByWithRelationInput;
    }): Promise<License[]> {
        return this.licenseRepository.findAll(params);
    }
    async updateLicense(id: string, data: Prisma.LicenseUpdateInput): Promise<License> {
        // Verificar se a licença existe
        await this.getLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.person) {
            const owner = await this.personRepository.findById(data.person as string);
            if (!owner) {
                throw new BadRequestError("Pessoa propriet\u00E1ria da licen\u00E7a n\u00E3o encontrada");
            }
        }
        return this.licenseRepository.update(id, data);
    }
    async deleteLicense(id: string): Promise<License> {
        // Verificar se a licença existe
        await this.getLicenseById(id);
        return this.licenseRepository.delete(id);
    }
}
