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
exports.Movements = void 0;
const typeorm_1 = require("typeorm");
let Movements = class Movements {
    movement_id;
    movement_date;
    person_id;
    total_amount;
    license_id;
    created_at;
    discount;
    addition;
    total_items;
    payment_method_id;
    description;
    movement_type_id;
    movement_status_id;
    is_template;
    updatedAt;
};
exports.Movements = Movements;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Movements.prototype, "movement_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Movements.prototype, "movement_date", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Movements.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Movements.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Movements.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], Movements.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Movements.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Movements.prototype, "addition", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0.00 }),
    __metadata("design:type", Number)
], Movements.prototype, "total_items", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Movements.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Movements.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Movements.prototype, "movement_type_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], Movements.prototype, "movement_status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], Movements.prototype, "is_template", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Movements.prototype, "updatedAt", void 0);
exports.Movements = Movements = __decorate([
    (0, typeorm_1.Entity)('movements')
], Movements);
//# sourceMappingURL=Movements.js.map