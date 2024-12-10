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
exports.ContractAdjustmentHistory = void 0;
const typeorm_1 = require("typeorm");
let ContractAdjustmentHistory = class ContractAdjustmentHistory {
    adjustment_history_id;
    contract_id;
    previous_value;
    new_value;
    change_date;
    change_type;
    changed_by;
    createdAt;
    updatedAt;
};
exports.ContractAdjustmentHistory = ContractAdjustmentHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ContractAdjustmentHistory.prototype, "adjustment_history_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ContractAdjustmentHistory.prototype, "contract_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ContractAdjustmentHistory.prototype, "previous_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ContractAdjustmentHistory.prototype, "new_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ContractAdjustmentHistory.prototype, "change_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], ContractAdjustmentHistory.prototype, "change_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ContractAdjustmentHistory.prototype, "changed_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContractAdjustmentHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContractAdjustmentHistory.prototype, "updatedAt", void 0);
exports.ContractAdjustmentHistory = ContractAdjustmentHistory = __decorate([
    (0, typeorm_1.Entity)('contract_adjustment_history')
], ContractAdjustmentHistory);
//# sourceMappingURL=Contract_adjustment_history.js.map