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
exports.BankAccounts = void 0;
const typeorm_1 = require("typeorm");
let BankAccounts = class BankAccounts {
    bank_account_id;
    account_entry_id;
    license_id;
    bank_name;
    agency_number;
    account_number;
    created_at;
    updated_at;
};
exports.BankAccounts = BankAccounts;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], BankAccounts.prototype, "bank_account_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BankAccounts.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BankAccounts.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 100 }),
    __metadata("design:type", String)
], BankAccounts.prototype, "bank_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 20 }),
    __metadata("design:type", String)
], BankAccounts.prototype, "agency_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 20 }),
    __metadata("design:type", String)
], BankAccounts.prototype, "account_number", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BankAccounts.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BankAccounts.prototype, "updated_at", void 0);
exports.BankAccounts = BankAccounts = __decorate([
    (0, typeorm_1.Entity)('bank_accounts')
], BankAccounts);
//# sourceMappingURL=BankAccounts.js.map