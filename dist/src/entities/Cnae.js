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
exports.Cnae = void 0;
const typeorm_1 = require("typeorm");
let Cnae = class Cnae {
    cnae_id;
    code;
    description;
    createdAt;
    updatedAt;
};
exports.Cnae = Cnae;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(cnae_cnae_id_seq)' }),
    __metadata("design:type", Number)
], Cnae.prototype, "cnae_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Cnae.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Cnae.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Cnae.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Cnae.prototype, "updatedAt", void 0);
exports.Cnae = Cnae = __decorate([
    (0, typeorm_1.Entity)('cnae')
], Cnae);
//# sourceMappingURL=Cnae.js.map