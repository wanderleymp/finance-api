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
exports.VwWebhooksPendentes = void 0;
const typeorm_1 = require("typeorm");
let VwWebhooksPendentes = class VwWebhooksPendentes {
    webhook_id;
    boleto_id;
    webhook_data;
    received_at;
    installment_id;
    last_status_update;
    installment_payment_id;
    processed_status;
    external_boleto_id;
    boleto_status;
    created_at;
    updated_at;
};
exports.VwWebhooksPendentes = VwWebhooksPendentes;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwWebhooksPendentes.prototype, "webhook_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwWebhooksPendentes.prototype, "boleto_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwWebhooksPendentes.prototype, "webhook_data", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwWebhooksPendentes.prototype, "received_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwWebhooksPendentes.prototype, "installment_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwWebhooksPendentes.prototype, "last_status_update", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwWebhooksPendentes.prototype, "installment_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], VwWebhooksPendentes.prototype, "processed_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwWebhooksPendentes.prototype, "external_boleto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], VwWebhooksPendentes.prototype, "boleto_status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwWebhooksPendentes.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwWebhooksPendentes.prototype, "updated_at", void 0);
exports.VwWebhooksPendentes = VwWebhooksPendentes = __decorate([
    (0, typeorm_1.Entity)('vw_webhooks_pendentes')
], VwWebhooksPendentes);
//# sourceMappingURL=VwWebhooksPendentes.js.map