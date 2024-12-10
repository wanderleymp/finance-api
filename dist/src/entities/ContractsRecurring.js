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
exports.ContractsRecurring = void 0;
const typeorm_1 = require("typeorm");
let ContractsRecurring = class ContractsRecurring {
    contract_value;
    start_date;
    end_date;
    due_day;
    days_before_due;
    model_movement_id;
    last_billing_date;
    next_billing_date;
    contract_id;
    contract_group_id;
    representative_person_id;
    commissioned_value;
    account_entry_id;
    last_decimo_billing_year;
    contract_name;
    recurrence_period;
    status;
    billing_reference;
    created_at;
    updated_at;
};
exports.ContractsRecurring = ContractsRecurring;
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "contract_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "due_day", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "days_before_due", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "model_movement_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "last_billing_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "next_billing_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "contract_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "contract_group_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "representative_person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "commissioned_value", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractsRecurring.prototype, "last_decimo_billing_year", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "contract_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "recurrence_period", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 20 }),
    __metadata("design:type", String)
], ContractsRecurring.prototype, "billing_reference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContractsRecurring.prototype, "updated_at", void 0);
exports.ContractsRecurring = ContractsRecurring = __decorate([
    (0, typeorm_1.Entity)('contracts_recurring')
], ContractsRecurring);
//# sourceMappingURL=ContractsRecurring.js.map