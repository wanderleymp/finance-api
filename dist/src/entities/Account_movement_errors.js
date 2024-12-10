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
exports.AccountMovementErrors = void 0;
const typeorm_1 = require("typeorm");
let AccountMovementErrors = class AccountMovementErrors {
    error_id;
    origin;
    operation;
    reference_id;
    parameters;
    error_message;
    status;
    created_at;
    updatedAt;
};
exports.AccountMovementErrors = AccountMovementErrors;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(account_movement_errors_error_id_seq)' }),
    __metadata("design:type", Number)
], AccountMovementErrors.prototype, "error_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], AccountMovementErrors.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], AccountMovementErrors.prototype, "operation", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AccountMovementErrors.prototype, "reference_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], AccountMovementErrors.prototype, "parameters", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AccountMovementErrors.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20, default: 'pending' }),
    __metadata("design:type", String)
], AccountMovementErrors.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], AccountMovementErrors.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AccountMovementErrors.prototype, "updatedAt", void 0);
exports.AccountMovementErrors = AccountMovementErrors = __decorate([
    (0, typeorm_1.Entity)('account_movement_errors')
], AccountMovementErrors);
//# sourceMappingURL=Account_movement_errors.js.map