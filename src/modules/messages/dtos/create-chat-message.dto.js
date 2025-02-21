const IsString = require('class-validator').IsString;
const IsOptional = require('class-validator').IsOptional;
const IsEnum = require('class-validator').IsEnum;
const IsObject = require('class-validator').IsObject;
const ValidateIf = require('class-validator').ValidateIf;
const IsNotEmpty = require('class-validator').IsNotEmpty;
const MaxLength = require('class-validator').MaxLength;
const IsBoolean = require('class-validator').IsBoolean;
const IsNumber = require('class-validator').IsNumber;
const ApiProperty = require('@nestjs/swagger').ApiProperty;
const Type = require('class-transformer').Type;

class CreateChatMessageDto {
    constructor() {
        this.chat_id = null;
        this.contact_id = null;
        this.remoteJid = '';
        this.messageType = '';
        this.content = '';
        this.base64 = '';
        this.direction = 'INBOUND';
        this.status = 'PENDING';
        this.metadata = {};
        this.fromMe = false;
        this.sender = '';
        this.pushName = '';
        this.serverUrl = '';
    }
}

// Decoradores para validação
CreateChatMessageDto.prototype.chat_id = [
    IsNotEmpty({ message: 'ID do chat é obrigatório' }),
    IsNumber()
];

CreateChatMessageDto.prototype.contact_id = [
    IsNotEmpty({ message: 'ID do contato é obrigatório' }),
    IsNumber()
];

CreateChatMessageDto.prototype.remoteJid = [
    IsNotEmpty({ message: 'Remote JID é obrigatório' }),
    IsString()
];

CreateChatMessageDto.prototype.messageType = [
    IsNotEmpty({ message: 'Tipo de mensagem é obrigatório' }),
    IsEnum(['text', 'audio', 'image', 'video', 'document'], { message: 'Tipo de mensagem inválido' })
];

CreateChatMessageDto.prototype.content = [
    IsOptional(),
    IsString()
];

CreateChatMessageDto.prototype.base64 = [
    ValidateIf(o => o.messageType !== 'text'),
    IsString(),
    MaxLength(10 * 1024 * 1024, { message: 'Arquivo muito grande' })
];

CreateChatMessageDto.prototype.direction = [
    IsEnum(['INBOUND', 'OUTBOUND'], { message: 'Direção inválida' })
];

CreateChatMessageDto.prototype.status = [
    IsEnum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'DELIVERY_ACK'], { message: 'Status inválido' })
];

CreateChatMessageDto.prototype.metadata = [
    IsOptional(),
    IsObject()
];

CreateChatMessageDto.prototype.fromMe = [
    IsBoolean()
];

CreateChatMessageDto.prototype.sender = [
    IsOptional(),
    IsString()
];

CreateChatMessageDto.prototype.pushName = [
    IsOptional(),
    IsString()
];

CreateChatMessageDto.prototype.serverUrl = [
    IsOptional(),
    IsString()
];

module.exports = { CreateChatMessageDto };
