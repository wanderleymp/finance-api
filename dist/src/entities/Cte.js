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
exports.Cte = void 0;
const typeorm_1 = require("typeorm");
let Cte = class Cte {
    cte_id;
    invoice_id;
    access_key;
    freight_mode;
    sender_person_id;
    receiver_person_id;
    freight_value;
    createdAt;
    updatedAt;
};
exports.Cte = Cte;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(cte_cte_id_seq)' }),
    __metadata("design:type", Number)
], Cte.prototype, "cte_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Cte.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 44 }),
    __metadata("design:type", String)
], Cte.prototype, "access_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Cte.prototype, "freight_mode", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Cte.prototype, "sender_person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Cte.prototype, "receiver_person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Cte.prototype, "freight_value", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Cte.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Cte.prototype, "updatedAt", void 0);
exports.Cte = Cte = __decorate([
    (0, typeorm_1.Entity)('cte')
], Cte);
//# sourceMappingURL=Cte.js.map