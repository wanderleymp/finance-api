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
exports.Roles = void 0;
const typeorm_1 = require("typeorm");
let Roles = class Roles {
    role_id;
    role_name;
    description;
    created_at;
    updated_at;
    status;
};
exports.Roles = Roles;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(roles_role_id_seq)' }),
    __metadata("design:type", Number)
], Roles.prototype, "role_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Roles.prototype, "role_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Roles.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Roles.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Roles.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20, default: 'active' }),
    __metadata("design:type", String)
], Roles.prototype, "status", void 0);
exports.Roles = Roles = __decorate([
    (0, typeorm_1.Entity)('roles')
], Roles);
//# sourceMappingURL=Roles.js.map