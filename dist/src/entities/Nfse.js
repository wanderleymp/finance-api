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
exports.Nfse = void 0;
const typeorm_1 = require("typeorm");
let Nfse = class Nfse {
    nfse_id;
    invoice_id;
    integration_nfse_id;
    service_value;
    iss_value;
    aliquota_service;
    createdAt;
    updatedAt;
};
exports.Nfse = Nfse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(nfse_nfse_id_seq)' }),
    __metadata("design:type", Number)
], Nfse.prototype, "nfse_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Nfse.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Nfse.prototype, "integration_nfse_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Nfse.prototype, "service_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Nfse.prototype, "iss_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Nfse.prototype, "aliquota_service", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Nfse.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Nfse.prototype, "updatedAt", void 0);
exports.Nfse = Nfse = __decorate([
    (0, typeorm_1.Entity)('nfse')
], Nfse);
//# sourceMappingURL=Nfse.js.map