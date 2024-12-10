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
exports.PersonTaxRegimes = void 0;
const typeorm_1 = require("typeorm");
let PersonTaxRegimes = class PersonTaxRegimes {
    person_id;
    tax_regime_id;
    start_date;
    createdAt;
    updatedAt;
};
exports.PersonTaxRegimes = PersonTaxRegimes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonTaxRegimes.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonTaxRegimes.prototype, "tax_regime_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PersonTaxRegimes.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PersonTaxRegimes.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PersonTaxRegimes.prototype, "updatedAt", void 0);
exports.PersonTaxRegimes = PersonTaxRegimes = __decorate([
    (0, typeorm_1.Entity)('person_tax_regimes')
], PersonTaxRegimes);
//# sourceMappingURL=Person_tax_regimes.js.map