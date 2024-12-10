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
exports.Boletos = void 0;
const typeorm_1 = require("typeorm");
let Boletos = class Boletos {
    boleto_id;
    installment_id;
    boleto_number;
    boleto_url;
    generated_at;
    status;
    codigo_barras;
    linha_digitavel;
    pix_copia_e_cola;
    last_status_update;
    external_boleto_id;
    createdAt;
    updatedAt;
};
exports.Boletos = Boletos;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(boletos_boleto_id_seq)' }),
    __metadata("design:type", Number)
], Boletos.prototype, "boleto_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Boletos.prototype, "installment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Boletos.prototype, "boleto_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Boletos.prototype, "boleto_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Boletos.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Boletos.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Boletos.prototype, "codigo_barras", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Boletos.prototype, "linha_digitavel", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 1024 }),
    __metadata("design:type", String)
], Boletos.prototype, "pix_copia_e_cola", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Boletos.prototype, "last_status_update", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], Boletos.prototype, "external_boleto_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Boletos.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Boletos.prototype, "updatedAt", void 0);
exports.Boletos = Boletos = __decorate([
    (0, typeorm_1.Entity)('boletos')
], Boletos);
//# sourceMappingURL=Boletos.js.map