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
exports.NotaFiscalEventos = void 0;
const typeorm_1 = require("typeorm");
let NotaFiscalEventos = class NotaFiscalEventos {
    evento_id;
    nota_fiscal_id;
    tipo_evento;
    data_evento;
    dados_evento;
    status;
    createdAt;
    updatedAt;
};
exports.NotaFiscalEventos = NotaFiscalEventos;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NotaFiscalEventos.prototype, "evento_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NotaFiscalEventos.prototype, "nota_fiscal_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], NotaFiscalEventos.prototype, "tipo_evento", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], NotaFiscalEventos.prototype, "data_evento", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], NotaFiscalEventos.prototype, "dados_evento", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], NotaFiscalEventos.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotaFiscalEventos.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotaFiscalEventos.prototype, "updatedAt", void 0);
exports.NotaFiscalEventos = NotaFiscalEventos = __decorate([
    (0, typeorm_1.Entity)('nota_fiscal_eventos')
], NotaFiscalEventos);
//# sourceMappingURL=Nota_fiscal_eventos.js.map