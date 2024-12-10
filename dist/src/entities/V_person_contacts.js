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
exports.VPersonContacts = void 0;
const typeorm_1 = require("typeorm");
let VPersonContacts = class VPersonContacts {
    person_id;
    contact_type_id;
    contact_type;
    group_id;
    group_name;
    contacts_json;
    full_name;
    createdAt;
    updatedAt;
};
exports.VPersonContacts = VPersonContacts;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VPersonContacts.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VPersonContacts.prototype, "contact_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], VPersonContacts.prototype, "contact_type", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VPersonContacts.prototype, "group_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VPersonContacts.prototype, "group_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], VPersonContacts.prototype, "contacts_json", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VPersonContacts.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VPersonContacts.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VPersonContacts.prototype, "updatedAt", void 0);
exports.VPersonContacts = VPersonContacts = __decorate([
    (0, typeorm_1.Entity)('v_person_contacts')
], VPersonContacts);
//# sourceMappingURL=V_person_contacts.js.map