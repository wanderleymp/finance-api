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
exports.AccountEntries = void 0;
const typeorm_1 = require("typeorm");
let AccountEntries = class AccountEntries {
    account_entry_id;
    account_plan_id;
    parent_account_id;
    account_level;
    created_at;
    updated_at;
    is_contra_account;
    account_code;
    account_name;
    account_type;
    created_at;
    updated_at;
};
exports.AccountEntries = AccountEntries;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], AccountEntries.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountEntries.prototype, "account_plan_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountEntries.prototype, "parent_account_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountEntries.prototype, "account_level", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AccountEntries.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AccountEntries.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], AccountEntries.prototype, "is_contra_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], AccountEntries.prototype, "account_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 100 }),
    __metadata("design:type", String)
], AccountEntries.prototype, "account_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], AccountEntries.prototype, "account_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AccountEntries.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AccountEntries.prototype, "updated_at", void 0);
exports.AccountEntries = AccountEntries = __decorate([
    (0, typeorm_1.Entity)('account_entries')
], AccountEntries);
//# sourceMappingURL=AccountEntries.js.map