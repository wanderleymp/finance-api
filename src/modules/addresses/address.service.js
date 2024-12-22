const { logger } = require('../../middlewares/logger');
const AddressRepository = require('./address.repository');
const cacheService = require('../../services/cacheService');
const AddressValidator = require('./validators/address.validator');
const CreateAddressDTO = require('./dto/create-address.dto');
const UpdateAddressDTO = require('./dto/update-address.dto');
const cepService = require('./cep.service');

class AddressService {
    constructor({ 
        addressRepository = new AddressRepository(), 
        cacheService 
    } = {}) {
        this.addressRepository = addressRepository;
        this.cacheService = cacheService || require('../../services/cacheService');
    }

    async findAll(filters = {}, page = 1, limit = 10) {
        try {
            const cacheKey = `addresses:list:${JSON.stringify(filters)}:page:${page}:limit:${limit}`;
            
            // Tenta buscar do cache
            let cachedResult;
            try {
                cachedResult = await this.cacheService.get(cacheKey);
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            if (cachedResult) {
                logger.info('Retornando endereços do cache', { cacheKey });
                return cachedResult;
            }

            const result = await this.addressRepository.findAll(filters, page, limit);
            
            // Salva no cache, ignorando erros
            try {
                await this.cacheService.set(cacheKey, result);
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            return result;
        } catch (error) {
            logger.error('Erro ao buscar endereços', {
                error: error.message,
                filters,
                page,
                limit
            });
            throw error;
        }
    }

    async findById(id, req = {}) {
        try {
            // Consulta direta sem paginação
            const address = await this.addressRepository.findById(id);
            
            if (!address) {
                throw new ValidationError('Endereço não encontrado', 404);
            }

            return address;
        } catch (error) {
            logger.error('Erro ao buscar endereço por ID', {
                error: error.message,
                id
            });

            throw error;
        }
    }

    async findByPersonId(personId) {
        try {
            const cacheKey = `person:${personId}:addresses`;
            
            // Tenta buscar do cache
            let cachedAddresses;
            try {
                cachedAddresses = await this.cacheService.get(cacheKey);
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            if (cachedAddresses) {
                logger.info('Retornando endereços da pessoa do cache', { cacheKey });
                return cachedAddresses;
            }

            const addresses = await this.addressRepository.findByPersonId(personId);
            
            // Salva no cache, ignorando erros
            try {
                await this.cacheService.set(cacheKey, addresses);
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            return addresses;
        } catch (error) {
            logger.error('Erro ao buscar endereços da pessoa', {
                error: error.message,
                personId
            });
            throw error;
        }
    }

    async enrichAddressWithIbge(addressData) {
        // Se já tem IBGE, não precisa enriquecer
        if (addressData.ibge) return addressData;

        // Se tem CEP, tenta buscar IBGE
        if (addressData.postal_code) {
            try {
                const cepDetails = await cepService.findAddressByCep(addressData.postal_code);
                
                // Atualiza apenas o campo IBGE
                addressData.ibge = cepDetails.ibge;
            } catch (error) {
                // Log do erro, mas não impede a criação do endereço
                logger.warn('Erro ao buscar IBGE pelo CEP', {
                    cep: addressData.postal_code,
                    error: error.message
                });
            }
        }

        return addressData;
    }

    async create(addressData, req = {}) {
        try {
            // Enriquece o endereço com IBGE antes de salvar
            const enrichedAddressData = await this.enrichAddressWithIbge(addressData);

            // Valida e transforma os dados
            const createDTO = new CreateAddressDTO(enrichedAddressData);
            const { error } = createDTO.validate(require('./schemas/address.schema'));
            
            if (error) {
                logger.warn('Dados de endereço inválidos', { 
                    error: error.message,
                    data: addressData 
                });
                throw new Error(error.message);
            }

            // Valida estado
            AddressValidator.validateState(createDTO.state);

            // Cria o endereço
            const newAddress = await this.addressRepository.create(createDTO);

            // Limpa cache relacionado
            await this.cacheService.delete(`person:${createDTO.person_id}:addresses`);
            
            logger.info('Endereço criado com sucesso', { 
                addressId: newAddress.id,
                personId: createDTO.person_id 
            });

            return newAddress;
        } catch (error) {
            logger.error('Erro ao criar endereço', {
                error: error.message,
                data: addressData
            });
            throw error;
        }
    }

    async update(id, addressData, req = {}) {
        try {
            // Enriquece o endereço com IBGE antes de atualizar
            const enrichedAddressData = await this.enrichAddressWithIbge(addressData);

            // Primeiro, verifica se o endereço existe
            const existingAddress = await this.findById(id);
            
            if (!existingAddress) {
                logger.warn('Tentativa de atualizar endereço inexistente', { id });
                throw new Error('Endereço não encontrado');
            }

            // Valida e transforma os dados
            const updateDTO = new UpdateAddressDTO(enrichedAddressData);
            const { error } = updateDTO.validate(require('./schemas/address.schema'));
            
            if (error) {
                logger.warn('Dados de atualização de endereço inválidos', { 
                    error: error.message,
                    data: addressData 
                });
                throw new Error(error.message);
            }

            // Valida estado e código postal, se fornecidos
            if (updateDTO.state) {
                AddressValidator.validateState(updateDTO.state);
            }
            if (updateDTO.postal_code) {
                AddressValidator.validatePostalCode(updateDTO.postal_code);
            }

            // Atualiza o endereço
            const updatedAddress = await this.addressRepository.update(id, updateDTO);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`address:${id}`),
                this.cacheService.delete(`person:${existingAddress.person_id}:addresses`),
                this.cacheService.delete(`person:${existingAddress.person_id}:main_address`)
            ]);

            logger.info('Endereço atualizado com sucesso', { 
                addressId: id,
                personId: existingAddress.person_id 
            });

            return updatedAddress;
        } catch (error) {
            logger.error('Erro ao atualizar endereço', {
                error: error.message,
                id,
                data: addressData
            });
            throw error;
        }
    }

    async delete(id, req = {}) {
        try {
            // Primeiro, verifica se o endereço existe
            const existingAddress = await this.findById(id);
            
            if (!existingAddress) {
                logger.warn('Tentativa de deletar endereço inexistente', { id });
                throw new Error('Endereço não encontrado');
            }

            // Impede deleção do endereço principal
            if (existingAddress.is_main) {
                logger.warn('Tentativa de deletar endereço principal', { id });
                throw new Error('Não é possível deletar o endereço principal');
            }

            // Deleta o endereço
            const deletedAddress = await this.addressRepository.delete(id);

            // Limpa cache relacionado
            await Promise.all([
                this.cacheService.delete(`address:${id}`),
                this.cacheService.delete(`person:${existingAddress.person_id}:addresses`),
                this.cacheService.delete(`person:${existingAddress.person_id}:main_address`)
            ]);

            logger.info('Endereço deletado com sucesso', { 
                addressId: id,
                personId: existingAddress.person_id 
            });

            return deletedAddress;
        } catch (error) {
            logger.error('Erro ao deletar endereço', {
                error: error.message,
                id
            });
            throw error;
        }
    }
}

module.exports = AddressService;
