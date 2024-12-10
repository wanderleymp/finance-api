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
exports.Chats = void 0;
const typeorm_1 = require("typeorm");
let Chats = class Chats {
    chat_id;
    person_id;
    channel_id;
    chat_classification;
    chat_priority;
    chat_status;
    assigned_to;
    is_internal;
    created_at;
    updated_at;
};
exports.Chats = Chats;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(chats_chat_id_seq)' }),
    __metadata("design:type", Number)
], Chats.prototype, "chat_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Chats.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Chats.prototype, "channel_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Chats.prototype, "chat_classification", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50, default: 'medium' }),
    __metadata("design:type", String)
], Chats.prototype, "chat_priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50, default: 'not_attended' }),
    __metadata("design:type", String)
], Chats.prototype, "chat_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Chats.prototype, "assigned_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], Chats.prototype, "is_internal", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Chats.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Chats.prototype, "updated_at", void 0);
exports.Chats = Chats = __decorate([
    (0, typeorm_1.Entity)('chats')
], Chats);
//# sourceMappingURL=Chats.js.map