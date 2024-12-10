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
exports.Nfce = void 0;
const typeorm_1 = require("typeorm");
let Nfce = class Nfce {
    nfce_id;
    invoice_id;
    qr_code;
    consumer_cpf_cnpj;
    consumer_name;
    createdAt;
    updatedAt;
};
exports.Nfce = Nfce;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(nfce_nfce_id_seq)' }),
    __metadata("design:type", Number)
], Nfce.prototype, "nfce_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Nfce.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Nfce.prototype, "qr_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Nfce.prototype, "consumer_cpf_cnpj", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Nfce.prototype, "consumer_name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Nfce.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Nfce.prototype, "updatedAt", void 0);
exports.Nfce = Nfce = __decorate([
    (0, typeorm_1.Entity)('nfce')
], Nfce);
//# sourceMappingURL=Nfce.js.map