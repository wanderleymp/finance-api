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
exports.PaymentMethods = void 0;
const typeorm_1 = require("typeorm");
let PaymentMethods = class PaymentMethods {
    payment_method_id;
    has_entry;
    installment_count;
    days_between_installments;
    first_due_date_days;
    account_entry_id;
    integration_mapping_id;
    payment_document_type_id;
    credential_id;
    bank_account_id;
    active;
    created_at;
    updated_at;
    deleted_at;
    method_name;
    description;
    created_at;
    updated_at;
};
exports.PaymentMethods = PaymentMethods;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], PaymentMethods.prototype, "has_entry", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "installment_count", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "days_between_installments", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "first_due_date_days", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "integration_mapping_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "payment_document_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "credential_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentMethods.prototype, "bank_account_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Boolean)
], PaymentMethods.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], PaymentMethods.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], PaymentMethods.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentMethods.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], PaymentMethods.prototype, "method_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentMethods.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentMethods.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PaymentMethods.prototype, "updated_at", void 0);
exports.PaymentMethods = PaymentMethods = __decorate([
    (0, typeorm_1.Entity)('payment_methods')
], PaymentMethods);
//# sourceMappingURL=PaymentMethods.js.map