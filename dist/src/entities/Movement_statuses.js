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
exports.MovementStatuses = void 0;
const typeorm_1 = require("typeorm");
let MovementStatuses = class MovementStatuses {
    movement_status_id;
    status_name;
    description;
    status_category_id;
    movement_type_id;
    is_final;
    display_order;
    createdAt;
    updatedAt;
};
exports.MovementStatuses = MovementStatuses;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(movement_statuses_movement_status_id_seq)' }),
    __metadata("design:type", Number)
], MovementStatuses.prototype, "movement_status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], MovementStatuses.prototype, "status_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MovementStatuses.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovementStatuses.prototype, "status_category_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MovementStatuses.prototype, "movement_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], MovementStatuses.prototype, "is_final", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MovementStatuses.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MovementStatuses.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MovementStatuses.prototype, "updatedAt", void 0);
exports.MovementStatuses = MovementStatuses = __decorate([
    (0, typeorm_1.Entity)('movement_statuses')
], MovementStatuses);
//# sourceMappingURL=Movement_statuses.js.map