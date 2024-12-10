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
exports.MessageTemplates = void 0;
const typeorm_1 = require("typeorm");
let MessageTemplates = class MessageTemplates {
    template_id;
    chat_type_id;
    template_content;
    created_at;
    updated_at;
    subject;
};
exports.MessageTemplates = MessageTemplates;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(message_templates_template_id_seq)' }),
    __metadata("design:type", Number)
], MessageTemplates.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MessageTemplates.prototype, "chat_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MessageTemplates.prototype, "template_content", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], MessageTemplates.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], MessageTemplates.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MessageTemplates.prototype, "subject", void 0);
exports.MessageTemplates = MessageTemplates = __decorate([
    (0, typeorm_1.Entity)('message_templates')
], MessageTemplates);
//# sourceMappingURL=Message_templates.js.map