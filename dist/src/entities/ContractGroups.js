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
exports.ContractGroups = void 0;
const typeorm_1 = require("typeorm");
let ContractGroups = class ContractGroups {
    contract_group_id;
    has_decimo_terceiro;
    vencimento1_dia;
    vencimento1_mes;
    vencimento2_dia;
    vencimento2_mes;
    decimo_payment_method_id;
    group_name;
    group_description;
    created_at;
    updated_at;
};
exports.ContractGroups = ContractGroups;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], ContractGroups.prototype, "contract_group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", Boolean)
], ContractGroups.prototype, "has_decimo_terceiro", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractGroups.prototype, "vencimento1_dia", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractGroups.prototype, "vencimento1_mes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractGroups.prototype, "vencimento2_dia", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractGroups.prototype, "vencimento2_mes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ContractGroups.prototype, "decimo_payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 100 }),
    __metadata("design:type", String)
], ContractGroups.prototype, "group_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractGroups.prototype, "group_description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContractGroups.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContractGroups.prototype, "updated_at", void 0);
exports.ContractGroups = ContractGroups = __decorate([
    (0, typeorm_1.Entity)('contract_groups')
], ContractGroups);
//# sourceMappingURL=ContractGroups.js.map