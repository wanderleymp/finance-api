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
exports.VwMovementTemplate = void 0;
const typeorm_1 = require("typeorm");
let VwMovementTemplate = class VwMovementTemplate {
    full_name;
    name;
    method_name;
    first_due_date_days;
    template_id;
    template_name;
    movement_type;
    person_id;
    license_id;
    payment_method_id;
    total_value;
    created_at;
    updated_at;
    generate_nfse;
    generate_boleto;
    default_discount;
    default_addition;
    active;
    service_id;
    description;
    license_name;
};
exports.VwMovementTemplate = VwMovementTemplate;
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "method_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "first_due_date_days", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "template_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "movement_type", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "license_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "payment_method_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "total_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VwMovementTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], VwMovementTemplate.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], VwMovementTemplate.prototype, "generate_nfse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], VwMovementTemplate.prototype, "generate_boleto", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "default_discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "default_addition", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], VwMovementTemplate.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], VwMovementTemplate.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], VwMovementTemplate.prototype, "license_name", void 0);
exports.VwMovementTemplate = VwMovementTemplate = __decorate([
    (0, typeorm_1.Entity)('vw_movement_template')
], VwMovementTemplate);
//# sourceMappingURL=Vw_movement_template.js.map