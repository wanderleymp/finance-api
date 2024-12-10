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
exports.ContractBillingLogs = void 0;
const typeorm_1 = require("typeorm");
let ContractBillingLogs = class ContractBillingLogs {
    log_id;
    contract_id;
    movement_id;
    log_message;
    log_timestamp;
    createdAt;
    updatedAt;
};
exports.ContractBillingLogs = ContractBillingLogs;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(contract_billing_logs_log_id_seq)' }),
    __metadata("design:type", Number)
], ContractBillingLogs.prototype, "log_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ContractBillingLogs.prototype, "contract_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ContractBillingLogs.prototype, "movement_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractBillingLogs.prototype, "log_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ContractBillingLogs.prototype, "log_timestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContractBillingLogs.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContractBillingLogs.prototype, "updatedAt", void 0);
exports.ContractBillingLogs = ContractBillingLogs = __decorate([
    (0, typeorm_1.Entity)('contract_billing_logs')
], ContractBillingLogs);
//# sourceMappingURL=Contract_billing_logs.js.map