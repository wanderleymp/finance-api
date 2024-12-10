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
exports.NfeSampa = void 0;
const typeorm_1 = require("typeorm");
let NfeSampa = class NfeSampa {
    nfe_sampa_id;
    chave_origem;
    json_data;
    emissao;
    json_retorno;
    url_xml;
    url_pdf;
    status;
    createdAt;
    updatedAt;
};
exports.NfeSampa = NfeSampa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(nfe_sampa_nfe_sampa_id_seq)' }),
    __metadata("design:type", Number)
], NfeSampa.prototype, "nfe_sampa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NfeSampa.prototype, "chave_origem", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], NfeSampa.prototype, "json_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: new Date() }),
    __metadata("design:type", Date)
], NfeSampa.prototype, "emissao", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], NfeSampa.prototype, "json_retorno", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NfeSampa.prototype, "url_xml", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NfeSampa.prototype, "url_pdf", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], NfeSampa.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NfeSampa.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NfeSampa.prototype, "updatedAt", void 0);
exports.NfeSampa = NfeSampa = __decorate([
    (0, typeorm_1.Entity)('nfe_sampa')
], NfeSampa);
//# sourceMappingURL=Nfe_sampa.js.map