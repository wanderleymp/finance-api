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
exports.InvoiceItems = void 0;
const typeorm_1 = require("typeorm");
let InvoiceItems = class InvoiceItems {
    item_id;
    invoice_id;
    description;
    quantity;
    unit_price;
    total_price;
    cfop;
    cst;
    aliquota;
    icms_base;
    icms_value;
    service_code;
    municipio_code;
    createdAt;
    updatedAt;
};
exports.InvoiceItems = InvoiceItems;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(invoice_items_item_id_seq)' }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "item_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InvoiceItems.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "total_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 10 }),
    __metadata("design:type", String)
], InvoiceItems.prototype, "cfop", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 10 }),
    __metadata("design:type", String)
], InvoiceItems.prototype, "cst", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "aliquota", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "icms_base", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], InvoiceItems.prototype, "icms_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], InvoiceItems.prototype, "service_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 10 }),
    __metadata("design:type", String)
], InvoiceItems.prototype, "municipio_code", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InvoiceItems.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InvoiceItems.prototype, "updatedAt", void 0);
exports.InvoiceItems = InvoiceItems = __decorate([
    (0, typeorm_1.Entity)('invoice_items')
], InvoiceItems);
//# sourceMappingURL=Invoice_items.js.map