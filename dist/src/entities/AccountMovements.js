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
exports.AccountMovements = void 0;
const typeorm_1 = require("typeorm");
let AccountMovements = class AccountMovements {
    amount;
    movement_date;
    reference_id;
    account_movement_id;
    account_entry_id;
    license_id;
    movement_type;
    description;
    status;
    reference_type;
    created_at;
    updated_at;
};
exports.AccountMovements = AccountMovements;
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], AccountMovements.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AccountMovements.prototype, "movement_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountMovements.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], AccountMovements.prototype, "account_movement_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountMovements.prototype, "account_entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AccountMovements.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 10 }),
    __metadata("design:type", String)
], AccountMovements.prototype, "movement_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AccountMovements.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AccountMovements.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], AccountMovements.prototype, "reference_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AccountMovements.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AccountMovements.prototype, "updated_at", void 0);
exports.AccountMovements = AccountMovements = __decorate([
    (0, typeorm_1.Entity)('account_movements')
], AccountMovements);
//# sourceMappingURL=AccountMovements.js.map