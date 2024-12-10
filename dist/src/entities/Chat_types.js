"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTypes = void 0;
const typeorm_1 = require("typeorm");
let ChatTypes = class ChatTypes {
    chat_type_id;
    description;
    category;
    created_at;
    updated_at;
};
exports.ChatTypes = ChatTypes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(chat_types_chat_type_id_seq)' }),
    __metadata("design:type", Number)
], ChatTypes.prototype, "chat_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ChatTypes.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], ChatTypes.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ChatTypes.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ChatTypes.prototype, "updated_at", void 0);
exports.ChatTypes = ChatTypes = __decorate([
    (0, typeorm_1.Entity)('chat_types')
], ChatTypes);
//# sourceMappingURL=Chat_types.js.map