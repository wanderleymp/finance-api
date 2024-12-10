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
exports.Receipts = void 0;
const typeorm_1 = require("typeorm");
let Receipts = class Receipts {
    receipt_id;
    installment_id;
    received_at;
    amount;
    createdAt;
    updatedAt;
};
exports.Receipts = Receipts;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(receipts_receipt_id_seq)' }),
    __metadata("design:type", Number)
], Receipts.prototype, "receipt_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Receipts.prototype, "installment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Receipts.prototype, "received_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Receipts.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Receipts.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Receipts.prototype, "updatedAt", void 0);
exports.Receipts = Receipts = __decorate([
    (0, typeorm_1.Entity)('receipts')
], Receipts);
//# sourceMappingURL=Receipts.js.map