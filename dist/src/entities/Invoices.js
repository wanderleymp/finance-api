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
exports.Invoices = void 0;
const typeorm_1 = require("typeorm");
let Invoices = class Invoices {
    invoice_id;
    reference_id;
    type;
    number;
    series;
    status;
    environment;
    pdf_url;
    xml_url;
    created_at;
    updated_at;
    movement_id;
    integration_id;
    emitente_person_id;
    destinatario_person_id;
    total_amount;
};
exports.Invoices = Invoices;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(invoices_invoice_id_seq)' }),
    __metadata("design:type", Number)
], Invoices.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ length: 100 }),
    __metadata("design:type", String)
], Invoices.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], Invoices.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Invoices.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Invoices.prototype, "series", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Invoices.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Invoices.prototype, "environment", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Invoices.prototype, "pdf_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Invoices.prototype, "xml_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Invoices.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Invoices.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Invoices.prototype, "movement_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true, default: 10 }),
    __metadata("design:type", Number)
], Invoices.prototype, "integration_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Invoices.prototype, "emitente_person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Invoices.prototype, "destinatario_person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Invoices.prototype, "total_amount", void 0);
exports.Invoices = Invoices = __decorate([
    (0, typeorm_1.Entity)('invoices')
], Invoices);
//# sourceMappingURL=Invoices.js.map