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
exports.InstallmentPayments = void 0;
const typeorm_1 = require("typeorm");
let InstallmentPayments = class InstallmentPayments {
    installment_payment_id;
    installment_id;
    payment_date;
    paid_amount;
    interest_amount;
    discount_amount;
    bank_account_id;
    created_at;
    updated_at;
};
exports.InstallmentPayments = InstallmentPayments;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], InstallmentPayments.prototype, "installment_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], InstallmentPayments.prototype, "installment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Date)
], InstallmentPayments.prototype, "payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], InstallmentPayments.prototype, "paid_amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InstallmentPayments.prototype, "interest_amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], InstallmentPayments.prototype, "discount_amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], InstallmentPayments.prototype, "bank_account_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], InstallmentPayments.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InstallmentPayments.prototype, "updated_at", void 0);
exports.InstallmentPayments = InstallmentPayments = __decorate([
    (0, typeorm_1.Entity)('installment_payments')
], InstallmentPayments);
//# sourceMappingURL=InstallmentPayments.js.map