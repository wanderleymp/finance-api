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
exports.LicenseAccountPlans = void 0;
const typeorm_1 = require("typeorm");
let LicenseAccountPlans = class LicenseAccountPlans {
    license_id;
    account_plan_id;
    createdAt;
    updatedAt;
};
exports.LicenseAccountPlans = LicenseAccountPlans;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LicenseAccountPlans.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LicenseAccountPlans.prototype, "account_plan_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LicenseAccountPlans.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LicenseAccountPlans.prototype, "updatedAt", void 0);
exports.LicenseAccountPlans = LicenseAccountPlans = __decorate([
    (0, typeorm_1.Entity)('license_account_plans')
], LicenseAccountPlans);
//# sourceMappingURL=License_account_plans.js.map