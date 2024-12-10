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
exports.Addresses = void 0;
const typeorm_1 = require("typeorm");
let Addresses = class Addresses {
    address_id;
    person_id;
    street;
    number;
    complement;
    neighborhood;
    city;
    state;
    postal_code;
    country;
    reference;
    ibge;
    createdAt;
    updatedAt;
};
exports.Addresses = Addresses;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(addresses_address_id_seq)' }),
    __metadata("design:type", Number)
], Addresses.prototype, "address_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Addresses.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Addresses.prototype, "street", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Addresses.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Addresses.prototype, "complement", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Addresses.prototype, "neighborhood", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Addresses.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2 }),
    __metadata("design:type", String)
], Addresses.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], Addresses.prototype, "postal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'Brasil' }),
    __metadata("design:type", String)
], Addresses.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Addresses.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Addresses.prototype, "ibge", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Addresses.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Addresses.prototype, "updatedAt", void 0);
exports.Addresses = Addresses = __decorate([
    (0, typeorm_1.Entity)('addresses')
], Addresses);
//# sourceMappingURL=Addresses.js.map