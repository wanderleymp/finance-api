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

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
            logger.debug('Service findAll - params:', {
                page,
                limit,
                filters
            });

            // Garante que page e limit são números
            const parsedPage = parseInt(page) || 1;
            const parsedLimit = parseInt(limit) || 10;

            // Gera uma chave única para o cache
            const cacheKey = `addresses:list:${JSON.stringify({
                page: parsedPage,
                limit: parsedLimit,
                filters
            })}`;
            
            // Tenta buscar do cache
            try {
                const cachedResult = await this.cacheService.get(cacheKey);
                if (cachedResult) {
                    logger.info('Retornando endereços do cache', { cacheKey });
                    return cachedResult;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }
            
            const result = await this.addressRepository.findAll(
                parsedPage,
                parsedLimit,
                filters
            );

            logger.debug('Service findAll - result:', {
                result
            });

            // Salva no cache com TTL reduzido
            try {
                await this.cacheService.set(cacheKey, result, 300); // 5 minutos
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

    async findById(id) {
        try {
            logger.debug('Service findById - params:', {
                id
            });

            const cacheKey = `address:${id}`;
            
            // Tenta buscar do cache
            try {
                const cachedAddress = await this.cacheService.get(cacheKey);
                if (cachedAddress) {
                    logger.info('Retornando endereço do cache', { cacheKey });
                    return cachedAddress;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const address = await this.addressRepository.findById(id);
            
            if (!address) {
                throw new ValidationError('Endereço não encontrado', 404);
            }

            // Salva no cache
            try {
                await this.cacheService.set(cacheKey, address, 3600); // 1 hora
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            logger.debug('Service findById - result:', {
                address
            });

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
            logger.debug('Service findByPersonId - params:', {
                personId
            });

            const cacheKey = `person:${personId}:addresses`;
            
            // Tenta buscar do cache
            try {
                const cachedAddresses = await this.cacheService.get(cacheKey);
                if (cachedAddresses) {
                    logger.info('Retornando endereços da pessoa do cache', { cacheKey });
                    return cachedAddresses;
                }
            } catch (cacheError) {
                logger.warn('Falha ao buscar do cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            const addresses = await this.addressRepository.findByPersonId(personId);
            
            // Salva no cache
            try {
                await this.cacheService.set(cacheKey, addresses, 1800); // 30 minutos
            } catch (cacheError) {
                logger.warn('Falha ao salvar no cache', { 
                    error: cacheError.message,
                    cacheKey 
                });
            }

            logger.debug('Service findByPersonId - result:', {
                addresses
            });

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
        logger.debug('Service enrichAddressWithIbge - params:', {
            addressData
        });

        // Se já tem IBGE, não precisa enriquecer
        if (addressData.ibge) return addressData;

        // Tenta buscar o IBGE pelo CEP
        if (addressData.cep) {
            try {
                const cepInfo = await cepService.findByCep(addressData.cep);
                if (cepInfo && cepInfo.ibge) {
                    addressData.ibge = cepInfo.ibge;
                }
            } catch (error) {
                logger.warn('Falha ao buscar IBGE pelo CEP', { 
                    error: error.message,
                    cep: addressData.cep 
                });
            }
        }

        logger.debug('Service enrichAddressWithIbge - result:', {
            addressData
        });

        return addressData;
    }

    async create(addressData) {
        try {
            logger.debug('Service create - params:', {
                addressData
            });

            // Enriquece o endereço com IBGE antes de salvar
            const enrichedAddressData = await this.enrichAddressWithIbge(addressData);

            // Valida os dados
            const createDTO = new CreateAddressDTO(enrichedAddressData);
            const validationResult = await AddressValidator.validateCreate(createDTO);

            if (!validationResult.isValid) {
                throw new ValidationError('Dados inválidos', 400, validationResult.errors);
            }

            // Verifica se já existe um endereço principal para a pessoa
            if (createDTO.is_main) {
                await this.unsetMainAddress(createDTO.person_id);
            }

            // Cria o endereço
            const newAddress = await this.addressRepository.create(createDTO);

            // Invalida caches relacionados
            try {
                await this.cacheService.delete(`person:${createDTO.person_id}:addresses`);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    personId: createDTO.person_id 
                });
            }

            logger.debug('Service create - result:', {
                newAddress
            });

            logger.info('Endereço criado com sucesso', { 
                addressId: newAddress.id,
                personId: createDTO.person_id 
            });

            return newAddress;
        } catch (error) {
            logger.error('Erro ao criar endereço', {
                error: error.message,
                addressData
            });
            throw error;
        }
    }

    async update(id, addressData) {
        try {
            logger.debug('Service update - params:', {
                id,
                addressData
            });

            // Enriquece o endereço com IBGE antes de atualizar
            const enrichedAddressData = await this.enrichAddressWithIbge(addressData);

            // Busca o endereço existente
            const existingAddress = await this.findById(id);
            
            if (!existingAddress) {
                throw new ValidationError('Endereço não encontrado', 404);
            }

            // Valida os dados
            const updateDTO = new UpdateAddressDTO({
                ...existingAddress,
                ...enrichedAddressData
            });

            const validationResult = await AddressValidator.validateUpdate(updateDTO);

            if (!validationResult.isValid) {
                throw new ValidationError('Dados inválidos', 400, validationResult.errors);
            }

            // Se está definindo como principal, remove o principal anterior
            if (updateDTO.is_main && !existingAddress.is_main) {
                await this.unsetMainAddress(existingAddress.person_id);
            }

            // Atualiza o endereço
            const updatedAddress = await this.addressRepository.update(id, updateDTO);

            // Invalida caches relacionados
            try {
                await Promise.all([
                    this.cacheService.delete(`address:${id}`),
                    this.cacheService.delete(`person:${existingAddress.person_id}:addresses`)
                ]);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    addressId: id,
                    personId: existingAddress.person_id 
                });
            }

            logger.debug('Service update - result:', {
                updatedAddress
            });

            logger.info('Endereço atualizado com sucesso', { 
                addressId: id,
                personId: existingAddress.person_id 
            });

            return updatedAddress;
        } catch (error) {
            logger.error('Erro ao atualizar endereço', {
                error: error.message,
                id,
                addressData
            });
            throw error;
        }
    }

    async delete(id) {
        try {
            logger.debug('Service delete - params:', {
                id
            });

            // Primeiro, verifica se o endereço existe
            const existingAddress = await this.findById(id);
            
            if (!existingAddress) {
                throw new ValidationError('Endereço não encontrado', 404);
            }

            // Não permite deletar o endereço principal
            if (existingAddress.is_main) {
                throw new ValidationError('Não é possível excluir o endereço principal', 400);
            }

            // Deleta o endereço
            const deletedAddress = await this.addressRepository.delete(id);

            // Invalida caches relacionados
            try {
                await Promise.all([
                    this.cacheService.delete(`address:${id}`),
                    this.cacheService.delete(`person:${existingAddress.person_id}:addresses`)
                ]);
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    addressId: id,
                    personId: existingAddress.person_id 
                });
            }

            logger.debug('Service delete - result:', {
                deletedAddress
            });

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

    async unsetMainAddress(personId) {
        try {
            const query = `
                UPDATE ${this.addressRepository.tableName}
                SET is_main = false
                WHERE person_id = $1 AND is_main = true
            `;

            await this.addressRepository.pool.query(query, [personId]);
        } catch (error) {
            logger.error('Erro ao remover endereço principal', {
                error: error.message,
                personId
            });
            throw error;
        }
    }
}

module.exports = AddressService;
