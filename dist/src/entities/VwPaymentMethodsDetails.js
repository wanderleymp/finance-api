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
exports.VwPaymentMethodsDetails = void 0;
const typeorm_1 = require("typeorm");
let VwPaymentMethodsDetails = class VwPaymentMethodsDetails {
    payment_method_id;
    has_entry;
    installment_count;
    days_between_installments;
    first_due_date_days;
    account_entry;
    bank_account;
    integration_credentials;
    integration_mapping;
    payment_document_type;
    licenses;
    method_name;
    description;
    created_at;
    updated_at;
};
exports.VwPaymentMethodsDetails = VwPaymentMethodsDetails;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwPaymentMethodsDetails.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], VwPaymentMethodsDetails.prototype, "has_entry", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwPaymentMethodsDetails.prototype, "installment_count", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwPaymentMethodsDetails.prototype, "days_between_installments", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwPaymentMethodsDetails.prototype, "first_due_date_days", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "account_entry", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "bank_account", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "integration_credentials", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "integration_mapping", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "payment_document_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwPaymentMethodsDetails.prototype, "licenses", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], VwPaymentMethodsDetails.prototype, "method_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwPaymentMethodsDetails.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwPaymentMethodsDetails.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwPaymentMethodsDetails.prototype, "updated_at", void 0);
exports.VwPaymentMethodsDetails = VwPaymentMethodsDetails = __decorate([
    (0, typeorm_1.Entity)('vw_payment_methods_details')
], VwPaymentMethodsDetails);
//# sourceMappingURL=VwPaymentMethodsDetails.js.map