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
exports.Contacts = void 0;
const typeorm_1 = require("typeorm");
let Contacts = class Contacts {
    contact_id;
    contact_type_id;
    contact_value;
    contact_name;
    createdAt;
    updatedAt;
};
exports.Contacts = Contacts;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(contacts_contact_id_seq)' }),
    __metadata("design:type", Number)
], Contacts.prototype, "contact_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Contacts.prototype, "contact_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Contacts.prototype, "contact_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 150 }),
    __metadata("design:type", String)
], Contacts.prototype, "contact_name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Contacts.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Contacts.prototype, "updatedAt", void 0);
exports.Contacts = Contacts = __decorate([
    (0, typeorm_1.Entity)('contacts')
], Contacts);
//# sourceMappingURL=Contacts.js.map