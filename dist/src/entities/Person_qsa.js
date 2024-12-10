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
exports.PersonQsa = void 0;
const typeorm_1 = require("typeorm");
let PersonQsa = class PersonQsa {
    juridical_person_id;
    physical_person_id;
    participation;
    administrator;
    createdAt;
    updatedAt;
};
exports.PersonQsa = PersonQsa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonQsa.prototype, "juridical_person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PersonQsa.prototype, "physical_person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'NULL' }),
    __metadata("design:type", Number)
], PersonQsa.prototype, "participation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], PersonQsa.prototype, "administrator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PersonQsa.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PersonQsa.prototype, "updatedAt", void 0);
exports.PersonQsa = PersonQsa = __decorate([
    (0, typeorm_1.Entity)('person_qsa')
], PersonQsa);
//# sourceMappingURL=Person_qsa.js.map