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
exports.UserPermissions = void 0;
const typeorm_1 = require("typeorm");
let UserPermissions = class UserPermissions {
    permission_id;
    created_at;
    permission_name;
    description;
    resource;
    action;
    created_at;
    updated_at;
};
exports.UserPermissions = UserPermissions;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], UserPermissions.prototype, "permission_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserPermissions.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 100 }),
    __metadata("design:type", String)
], UserPermissions.prototype, "permission_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], UserPermissions.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 50 }),
    __metadata("design:type", String)
], UserPermissions.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, length: 20 }),
    __metadata("design:type", String)
], UserPermissions.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserPermissions.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserPermissions.prototype, "updated_at", void 0);
exports.UserPermissions = UserPermissions = __decorate([
    (0, typeorm_1.Entity)('user_permissions')
], UserPermissions);
//# sourceMappingURL=UserPermissions.js.map