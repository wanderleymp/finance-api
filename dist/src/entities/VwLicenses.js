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
exports.VwLicenses = void 0;
const typeorm_1 = require("typeorm");
let VwLicenses = class VwLicenses {
    license_id;
    person_id;
    start_date;
    end_date;
    users;
    license_name;
    status;
    timezone;
    created_at;
    updated_at;
};
exports.VwLicenses = VwLicenses;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwLicenses.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], VwLicenses.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwLicenses.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], VwLicenses.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], VwLicenses.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], VwLicenses.prototype, "license_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], VwLicenses.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], VwLicenses.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VwLicenses.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VwLicenses.prototype, "updated_at", void 0);
exports.VwLicenses = VwLicenses = __decorate([
    (0, typeorm_1.Entity)('vw_licenses')
], VwLicenses);
//# sourceMappingURL=VwLicenses.js.map