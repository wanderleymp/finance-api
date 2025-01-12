const { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean } = require('class-validator');

class CreateServiceDto {
    /**
     * ID do item associado ao serviço
     */
    @IsNotEmpty()
    @IsNumber()
    itemId;

    /**
     * ID do grupo de serviço
     */
    @IsOptional()
    @IsNumber()
    serviceGroupId;

    /**
     * Descrição do serviço
     */
    @IsNotEmpty()
    @IsString()
    description;

    /**
     * Nome do serviço
     */
    @IsNotEmpty()
    @IsString()
    name;

    /**
     * Status de ativação do serviço
     */
    @IsOptional()
    @IsBoolean()
    active = true;
}

module.exports = CreateServiceDto;
