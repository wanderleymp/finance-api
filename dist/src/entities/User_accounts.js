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
exports.UserAccounts = void 0;
const typeorm_1 = require("typeorm");
let UserAccounts = class UserAccounts {
    user_id;
    username;
    password;
    person_id;
    profile_id;
    createdAt;
    updatedAt;
};
exports.UserAccounts = UserAccounts;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(user_accounts_user_id_seq)' }),
    __metadata("design:type", Number)
], UserAccounts.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], UserAccounts.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], UserAccounts.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserAccounts.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], UserAccounts.prototype, "profile_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserAccounts.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserAccounts.prototype, "updatedAt", void 0);
exports.UserAccounts = UserAccounts = __decorate([
    (0, typeorm_1.Entity)('user_accounts')
], UserAccounts);
//# sourceMappingURL=User_accounts.js.map