import { PersonLicense, Prisma } from '@prisma/client';
import { PersonLicenseRepository } from '../repositories/personLicenseRepository';
import { PersonRepository } from '../repositories/personRepository';
import { LicenseRepository } from '../repositories/licenseRepository';
import { BadRequestError } from '../errors/badRequestError';
export class PersonLicenseService {
    private personLicenseRepository: PersonLicenseRepository;
    private personRepository: PersonRepository;
    private licenseRepository: LicenseRepository;
    constructor() {
        this.personLicenseRepository = new PersonLicenseRepository();
        this.personRepository = new PersonRepository();
        this.licenseRepository = new LicenseRepository();
    }
    async assignLicenseToPerson(data: Prisma.PersonLicenseCreateInput): Promise<PersonLicense> {
        // Validar se a pessoa existe
        const person = await this.personRepository.findById(data.person);
        if (!person) {
            throw new BadRequestError("Pessoa n\u00E3o encontrada");
        }
        // Validar se a licença existe
        const license = await this.licenseRepository.findById(data.license);
        if (!license) {
            throw new BadRequestError("Licen\u00E7a n\u00E3o encontrada");
        }
        // Verificar se já existe essa associação
        const existingAssociation = await this.personLicenseRepository.findByPersonAndLicense(data.person, data.license);
        if (existingAssociation) {
            throw new BadRequestError("Pessoa j\u00E1 possui esta licen\u00E7a");
        }
        return this.personLicenseRepository.create(data);
    }
    async getPersonLicenseById(id: string): Promise<PersonLicense | null> {
        const personLicense = await this.personLicenseRepository.findById(id);
        if (!personLicense) {
            throw new BadRequestError("Associa\u00E7\u00E3o de pessoa e licen\u00E7a n\u00E3o encontrada");
        }
        return personLicense;
    }
    async getAllPersonLicenses(params?: {
        skip?: number;
        take?: number;
        cursor?: Prisma.PersonLicenseWhereUniqueInput;
        where?: Prisma.PersonLicenseWhereInput;
        orderBy?: Prisma.PersonLicenseOrderByWithRelationInput;
    }): Promise<PersonLicense[]> {
        return this.personLicenseRepository.findAll(params);
    }
    async updatePersonLicense(id: string, data: Prisma.PersonLicenseUpdateInput): Promise<PersonLicense> {
        // Verificar se a associação existe
        await this.getPersonLicenseById(id);
        // Validações adicionais podem ser adicionadas aqui
        if (data.person) {
            const person = await this.personRepository.findById(data.person as string);
            if (!person) {
                throw new BadRequestError("Pessoa n\u00E3o encontrada");
            }
        }
        if (data.license) {
            const license = await this.licenseRepository.findById(data.license as string);
            if (!license) {
                throw new BadRequestError("Licen\u00E7a n\u00E3o encontrada");
            }
        }
        return this.personLicenseRepository.update(id, data);
    }
    async removePersonLicense(id: string): Promise<PersonLicense> {
        // Verificar se a associação existe
        await this.getPersonLicenseById(id);
        return this.personLicenseRepository.delete(id);
    }
}
