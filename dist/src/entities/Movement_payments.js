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
exports.MovementPayments = void 0;
const typeorm_1 = require("typeorm");
let MovementPayments = class MovementPayments {
    payment_id;
    movement_id;
    payment_method_id;
    total_amount;
    status;
    createdAt;
    updatedAt;
};
exports.MovementPayments = MovementPayments;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovementPayments.prototype, "payment_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovementPayments.prototype, "movement_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovementPayments.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], MovementPayments.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20, default: 'Pendente' }),
    __metadata("design:type", String)
], MovementPayments.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MovementPayments.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MovementPayments.prototype, "updatedAt", void 0);
exports.MovementPayments = MovementPayments = __decorate([
    (0, typeorm_1.Entity)('movement_payments')
], MovementPayments);
//# sourceMappingURL=Movement_payments.js.map