const { logger } = require('../../middlewares/logger');
const AddressRepository = require('./address.repository');
const AddressValidator = require('./validators/address.validator');
const CreateAddressDTO = require('./dto/create-address.dto');
const UpdateAddressDTO = require('./dto/update-address.dto');
const cepService = require('./cep.service');

class AddressService {
    constructor({ 
        addressRepository = new AddressRepository(), 
    } = {}) {
        this.addressRepository = addressRepository;
    }

    async findAll(page = 1, limit = 10, filters = {}) {
        try {
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

            // Salva no cache com TTL reduzido
            try {
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
            logger.info('Service: Buscando endereços da pessoa', { personId });

            const addresses = await this.addressRepository.findAll(1, 100, { person_id: personId });

            return addresses.items;
        } catch (error) {
            logger.error('Service: Erro ao buscar endereços da pessoa', { 
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
        if (addressData.postal_code) {
            try {
                const cepInfo = await cepService.findAddressByCep(addressData.postal_code);
                if (cepInfo && cepInfo.ibge) {
                    addressData.ibge = cepInfo.ibge;
                }
            } catch (error) {
                logger.warn('Falha ao buscar IBGE pelo CEP', { 
                    error: error.message,
                    cep: addressData.postal_code 
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
            await AddressValidator.validateCreate(createDTO);

            // Verifica se já existe um endereço principal para a pessoa
            if (createDTO.is_main) {
                await this.unsetMainAddress(createDTO.person_id);
            }

            // Cria o endereço
            const newAddress = await this.addressRepository.create(createDTO);

            // Invalida caches relacionados
            try {
            } catch (cacheError) {
                logger.warn('Falha ao invalidar cache', { 
                    error: cacheError.message,
                    personId: createDTO.person_id 
                });
            }

            logger.debug('Service create - result:', {
                newAddress
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

            // Se a validação falhar, ela lançará um erro
            await AddressValidator.validateUpdate(updateDTO);

            // Atualiza o endereço
            const updatedAddress = await this.addressRepository.update(id, updateDTO);

            // Invalida caches relacionados
            try {
                await Promise.all([
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
