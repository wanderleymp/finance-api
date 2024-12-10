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
exports.SystemDefaultAccounts = void 0;
const typeorm_1 = require("typeorm");
let SystemDefaultAccounts = class SystemDefaultAccounts {
    default_account_id;
    account_entry_id;
    created_at;
    account_type;
    description;
    created_at;
    updated_at;
};
exports.SystemDefaultAccounts = SystemDefaultAccounts;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], SystemDefaultAccounts.prototype, "default_account_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], SystemDefaultAccounts.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SystemDefaultAccounts.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], SystemDefaultAccounts.prototype, "account_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SystemDefaultAccounts.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SystemDefaultAccounts.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SystemDefaultAccounts.prototype, "updated_at", void 0);
exports.SystemDefaultAccounts = SystemDefaultAccounts = __decorate([
    (0, typeorm_1.Entity)('system_default_accounts')
], SystemDefaultAccounts);
//# sourceMappingURL=SystemDefaultAccounts.js.map