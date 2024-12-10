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
exports.VwBoletosSemPagamento = void 0;
const typeorm_1 = require("typeorm");
let VwBoletosSemPagamento = class VwBoletosSemPagamento {
    webhook_id;
    boleto_id;
    installment_id;
    external_boleto_id;
    boleto_status;
    last_status_update;
    createdAt;
    updatedAt;
};
exports.VwBoletosSemPagamento = VwBoletosSemPagamento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwBoletosSemPagamento.prototype, "webhook_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwBoletosSemPagamento.prototype, "boleto_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwBoletosSemPagamento.prototype, "installment_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VwBoletosSemPagamento.prototype, "external_boleto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], VwBoletosSemPagamento.prototype, "boleto_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VwBoletosSemPagamento.prototype, "last_status_update", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwBoletosSemPagamento.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwBoletosSemPagamento.prototype, "updatedAt", void 0);
exports.VwBoletosSemPagamento = VwBoletosSemPagamento = __decorate([
    (0, typeorm_1.Entity)('vw_boletos_sem_pagamento')
], VwBoletosSemPagamento);
//# sourceMappingURL=Vw_boletos_sem_pagamento.js.map