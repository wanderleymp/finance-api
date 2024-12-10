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
exports.Nfe = void 0;
const typeorm_1 = require("typeorm");
let Nfe = class Nfe {
    nfe_id;
    invoice_id;
    access_key;
    freight_value;
    insurance_value;
    icms_exemption;
    createdAt;
    updatedAt;
};
exports.Nfe = Nfe;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(nfe_nfe_id_seq)' }),
    __metadata("design:type", Number)
], Nfe.prototype, "nfe_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Nfe.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 44 }),
    __metadata("design:type", String)
], Nfe.prototype, "access_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Nfe.prototype, "freight_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Nfe.prototype, "insurance_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], Nfe.prototype, "icms_exemption", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Nfe.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Nfe.prototype, "updatedAt", void 0);
exports.Nfe = Nfe = __decorate([
    (0, typeorm_1.Entity)('nfe')
], Nfe);
//# sourceMappingURL=Nfe.js.map