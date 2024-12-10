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
exports.Licenses = void 0;
const typeorm_1 = require("typeorm");
let Licenses = class Licenses {
    license_id;
    person_id;
    license_name;
    start_date;
    end_date;
    status;
    timezone;
    active;
    createdAt;
    updatedAt;
};
exports.Licenses = Licenses;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(licenses_license_id_seq)' }),
    __metadata("design:type", Number)
], Licenses.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Licenses.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Licenses.prototype, "license_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Licenses.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Licenses.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'Ativa' }),
    __metadata("design:type", String)
], Licenses.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Licenses.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Licenses.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Licenses.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Licenses.prototype, "updatedAt", void 0);
exports.Licenses = Licenses = __decorate([
    (0, typeorm_1.Entity)('licenses')
], Licenses);
//# sourceMappingURL=Licenses.js.map