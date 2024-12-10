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
exports.BoletoWebhookResponses = void 0;
const typeorm_1 = require("typeorm");
let BoletoWebhookResponses = class BoletoWebhookResponses {
    webhook_id;
    boleto_id;
    webhook_data;
    received_at;
    processed_at;
    external_boleto_id;
    processed_status;
    error_message;
    created_at;
    updated_at;
};
exports.BoletoWebhookResponses = BoletoWebhookResponses;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], BoletoWebhookResponses.prototype, "webhook_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BoletoWebhookResponses.prototype, "boleto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Object)
], BoletoWebhookResponses.prototype, "webhook_data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BoletoWebhookResponses.prototype, "received_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BoletoWebhookResponses.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], BoletoWebhookResponses.prototype, "external_boleto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], BoletoWebhookResponses.prototype, "processed_status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BoletoWebhookResponses.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BoletoWebhookResponses.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BoletoWebhookResponses.prototype, "updated_at", void 0);
exports.BoletoWebhookResponses = BoletoWebhookResponses = __decorate([
    (0, typeorm_1.Entity)('boleto_webhook_responses')
], BoletoWebhookResponses);
//# sourceMappingURL=BoletoWebhookResponses.js.map