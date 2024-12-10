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
exports.ChatLogs = void 0;
const typeorm_1 = require("typeorm");
let ChatLogs = class ChatLogs {
    chat_log_id;
    chat_id;
    event_details;
    performed_by;
    created_at;
    event_type;
    created_at;
    updated_at;
};
exports.ChatLogs = ChatLogs;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], ChatLogs.prototype, "chat_log_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], ChatLogs.prototype, "chat_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], ChatLogs.prototype, "event_details", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChatLogs.prototype, "performed_by", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChatLogs.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 255 }),
    __metadata("design:type", String)
], ChatLogs.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatLogs.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChatLogs.prototype, "updated_at", void 0);
exports.ChatLogs = ChatLogs = __decorate([
    (0, typeorm_1.Entity)('chat_logs')
], ChatLogs);
//# sourceMappingURL=ChatLogs.js.map