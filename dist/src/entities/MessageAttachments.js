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
exports.MessageAttachments = void 0;
const typeorm_1 = require("typeorm");
let MessageAttachments = class MessageAttachments {
    attachment_id;
    message_id;
    file_path;
    file_type;
    created_at;
    updated_at;
};
exports.MessageAttachments = MessageAttachments;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], MessageAttachments.prototype, "attachment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], MessageAttachments.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 255 }),
    __metadata("design:type", String)
], MessageAttachments.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MessageAttachments.prototype, "file_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageAttachments.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MessageAttachments.prototype, "updated_at", void 0);
exports.MessageAttachments = MessageAttachments = __decorate([
    (0, typeorm_1.Entity)('message_attachments')
], MessageAttachments);
//# sourceMappingURL=MessageAttachments.js.map