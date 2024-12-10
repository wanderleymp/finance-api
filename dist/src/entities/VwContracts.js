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
exports.VwContracts = void 0;
const typeorm_1 = require("typeorm");
let VwContracts = class VwContracts {
    contract_id;
    contract_value;
    start_date;
    end_date;
    due_day;
    days_before_due;
    last_billing_date;
    next_billing_date;
    contract_group_id;
    person_id;
    model_movement_id;
    model_movement_date;
    model_total_amount;
    person_name;
    contract_name;
    contract_group_name;
    recurrence_period;
    created_at;
    updated_at;
};
exports.VwContracts = VwContracts;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "contract_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwContracts.prototype, "contract_value", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "due_day", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "days_before_due", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "last_billing_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "next_billing_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "contract_group_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwContracts.prototype, "model_movement_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "model_movement_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], VwContracts.prototype, "model_total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwContracts.prototype, "person_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], VwContracts.prototype, "contract_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], VwContracts.prototype, "contract_group_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], VwContracts.prototype, "recurrence_period", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwContracts.prototype, "updated_at", void 0);
exports.VwContracts = VwContracts = __decorate([
    (0, typeorm_1.Entity)('vw_contracts')
], VwContracts);
//# sourceMappingURL=VwContracts.js.map