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
exports.N8nChatHistories = void 0;
const typeorm_1 = require("typeorm");
let N8nChatHistories = class N8nChatHistories {
    id;
    session_id;
    message;
    createdAt;
    updatedAt;
};
exports.N8nChatHistories = N8nChatHistories;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(n8n_chat_histories_id_seq)' }),
    __metadata("design:type", Number)
], N8nChatHistories.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ length: 255 }),
    __metadata("design:type", String)
], N8nChatHistories.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], N8nChatHistories.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], N8nChatHistories.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], N8nChatHistories.prototype, "updatedAt", void 0);
exports.N8nChatHistories = N8nChatHistories = __decorate([
    (0, typeorm_1.Entity)('n8n_chat_histories')
], N8nChatHistories);
//# sourceMappingURL=N8n_chat_histories.js.map